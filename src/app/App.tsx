import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Auth } from '../components/Auth';
import { Layout } from '../components/Layout';
import { AddForm } from '../components/AddForm';
import AddItemForm from '../components/AddItemForm';
import { ItemCard } from '../components/ItemCard';
import { EditModal } from '../components/EditModal';
import { Toast } from '../components/Toast';
import { autoTagItem } from '../tagger';
import { STORE_OPTIONS, getItemIcon, CATEGORIES, getCategoryBgColor, getCategoryIcon, normalizeCategoryName } from '../constants';
import { Icon } from '@iconify/react';
import { db, auth, analytics } from '../firebase';
import { Analytics } from '@vercel/analytics/react';
import { logEvent } from 'firebase/analytics';
import { 
	collection, onSnapshot, addDoc, doc, updateDoc, 
	deleteDoc, getDoc, setDoc, query, where 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface GroceryItem {
	id: string;
	name: string;
	category: string;
	store: string;
	inCart: boolean;
	createdAt?: string;
	userId?: string;
	cartedAt?: string | null;
	trackHabit?: boolean;
}

type HabitStatus = 'Restock Soon' | 'In Stock' | 'Lapsed' | 'Need Data';

const ITEM_SYNONYM_MAP: Record<string, string> = {
	// Dairy & Curd
	'curd': 'yogurt',
	'dahi': 'yogurt',
	'plain yogurt': 'yogurt',
	'greek yogurt': 'yogurt',
	'yoghurt': 'yogurt',
	// Frozen Veggies
	'frozen veg': 'frozen vegetable',
	'frozen veggie': 'frozen vegetable',
	'frozen veggies': 'frozen vegetable',
	'frozen vegetables': 'frozen vegetable',
	// Produce & Herbs
	'cilantro': 'coriander',
	'coriander leaf': 'coriander',
	'coriander leaves': 'coriander',
	'aubergine': 'eggplant',
	'brinjal': 'eggplant',
	'courgette': 'zucchini',
	'scallion': 'green onion',
	'spring onion': 'green onion',
	'capsicum': 'bell pepper',
	// Staples & Household
	'atta': 'aata',
	'whole wheat flour': 'aata',
	'chapati flour': 'aata',
	'chilli': 'chili',
	'nappy': 'diaper',
	'nappies': 'diaper',
};

const normalizeItemName = (name: string) => {
	let n = name.trim().toLowerCase().replace(/\s+/g, ' ');
	
	// 1. Check direct phrase alias first (e.g., "frozen veggies" -> "frozen vegetable")
	if (ITEM_SYNONYM_MAP[n]) return ITEM_SYNONYM_MAP[n];

	// 2. Standard singularization
	if (n.endsWith('ies')) n = n.slice(0, -3) + 'y';
	else if (n.endsWith('oes')) n = n.slice(0, -2);
	else if (n.endsWith('s') && !n.endsWith('ss')) n = n.slice(0, -1);

	// 3. Re-check alias after singularizing (e.g., "curds" -> "curd" -> "yogurt")
	return ITEM_SYNONYM_MAP[n] || n;
};

const isDuplicateItem = (newItem: string, existingItem: string) => {
	return normalizeItemName(newItem) === normalizeItemName(existingItem);
};

const DEFAULT_VELOCITY: Record<string, number> = {
	'milk': 7,
	'eggs': 14,
	'bread': 7,
	'bananas': 5,
	'coffee': 30,
	'olive oil': 60,
	'paper towels': 30,
	'laundry detergent': 45
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MIN_CYCLE_GAP_MS = 3 * MS_PER_DAY;

export default function App() {
	useEffect(() => {
		const handleAppInstalled = () => {
			if (analytics) {
				logEvent(analytics, 'pwa_installed', {
					platform: navigator.userAgent,
					timestamp: new Date().toISOString(),
				});
			}
		};
		window.addEventListener('appinstalled', handleAppInstalled);
		return () => window.removeEventListener('appinstalled', handleAppInstalled);
	}, []);

	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('list');
	const [items, setItems] = useState<GroceryItem[]>([]);
	const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
	const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [showStaleCartWarning, setShowStaleCartWarning] = useState(false);

	const [expandedCartStore, setExpandedCartStore] = useState<string | null>(null);
	const [nowTick, setNowTick] = useState(() => Date.now());

	// Habits State
	const [habitSearchQuery, setHabitSearchQuery] = useState('');
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());
	const [singleRemoveModalItem, setSingleRemoveModalItem] = useState<any | null>(null);
	const [batchRemoveModalVisible, setBatchRemoveModalVisible] = useState(false);

	// Swipe & Touch Tracking
	const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
	const touchStartXRef = useRef<number>(0);
	const touchStartYRef = useRef<number>(0);
	const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isScrollingRef = useRef<boolean>(false);

	const [habitSortFilter, setHabitSortFilterState] = useState(() => {
		return localStorage.getItem('groceryRun_habitSortFilter') || 'urgency';
	});

	const setHabitSortFilter = (value: string) => {
		setHabitSortFilterState(value);
		localStorage.setItem('groceryRun_habitSortFilter', value);
	};

	const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
	const [trackingOverrides, setTrackingOverrides] = useState<Record<string, boolean>>({});
	const [preferences, setPreferences] = useState<Record<string, any>>({});

	const getPrefDocId = (uid: string, nameKey: string) => `${uid}_${nameKey}`;

	const [hasDismissedReminder, setHasDismissedReminderState] = useState(() => {
		return sessionStorage.getItem('cartReminderDismissed') === 'true';
	});

	const setHasDismissedReminder = (value: boolean) => {
		setHasDismissedReminderState(value);
		if (value) {
			sessionStorage.setItem('cartReminderDismissed', 'true');
		} else {
			sessionStorage.removeItem('cartReminderDismissed');
		}
	};

	const handleDismissSuggestion = (itemName: string) => {
		setDismissedSuggestions(prev => {
			const newSet = new Set(prev);
			newSet.add(itemName.toLowerCase());
			return newSet;
		});
	};

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});
		return () => unsubscribeAuth();
	}, []);

	useEffect(() => {
		if (!user) {
			setItems([]);
			setPurchaseHistory([]);
			setPreferences({});
			return;
		}

		const unsubscribeItems = onSnapshot(
			query(collection(db, 'items'), where('userId', '==', user.uid)),
			(snapshot) => {
				const liveItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroceryItem));
				setItems(liveItems);
			}
		);

		const unsubscribeHistory = onSnapshot(
			query(collection(db, 'purchaseHistory'), where('userId', '==', user.uid)),
			(snapshot) => {
				const liveHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
				setPurchaseHistory(liveHistory);
			}
		);

		const unsubscribePrefs = onSnapshot(collection(db, 'preferences'), (snapshot) => {
			const prefsObj: Record<string, any> = {};
			const prefix = `${user.uid}_`;
			snapshot.docs.forEach(docSnap => {
				const data = docSnap.data();
				if (docSnap.id.startsWith(prefix)) {
					const cleanKey = docSnap.id.slice(prefix.length);
					prefsObj[cleanKey] = data;
				} else if (data.userId === user.uid) {
					prefsObj[docSnap.id] = data;
				}
			});
			setPreferences(prefsObj);
		});

		return () => {
			unsubscribeItems();
			unsubscribeHistory();
			unsubscribePrefs();
		};
	}, [user]);

	const getLatestStoreFromHistory = (nameKey: string): string | null => {
		let latestTime = -1;
		let latestStore: string | null = null;

		purchaseHistory.forEach(order => {
			if (!order.date || !order.items) return;
			const orderTime = new Date(order.date).getTime();
			order.items.forEach((item: GroceryItem) => {
				if (normalizeItemName(item.name || '') === nameKey && item.store && item.store !== 'Unknown') {
					if (orderTime >= latestTime) {
						latestTime = orderTime;
						latestStore = item.store;
					}
				}
			});
		});

		return latestStore;
	};

	const handleAddItem = async (newItemName: string) => {
		if (!user) return;
		
		const nameKey = normalizeItemName(newItemName);
		const existingMatch = items.find(item => isDuplicateItem(newItemName, item.name));

		if (existingMatch) {
			setToastMessage(`${existingMatch.name} is already in your list`);
			return; 
		}

		let learnedCat = preferences[nameKey]?.category || null;
		let learnedTrackHabit: boolean | undefined = preferences[nameKey]?.trackHabit;
		let learnedStore = preferences[nameKey]?.lastPurchasedStore || getLatestStoreFromHistory(nameKey) || null; 

		if (!learnedStore || !learnedCat) {
			try {
				const prefRef = doc(db, 'preferences', getPrefDocId(user.uid, nameKey));
				const prefSnap = await getDoc(prefRef);
				if (prefSnap.exists()) {
					const data = prefSnap.data();
					learnedCat = learnedCat || data.category;
					learnedStore = learnedStore || data.lastPurchasedStore; 
					if (data.trackHabit !== undefined) {
						learnedTrackHabit = data.trackHabit;
					}
				}
			} catch (error) {
				console.warn("Database read failed. Defaulting to auto-tagger.");
			}
		}
		
		const { category: autoCat, store: autoStore, trackHabit: autoTrackHabit } = autoTagItem(newItemName);
		const finalCat = learnedCat ? normalizeCategoryName(learnedCat) : autoCat;
		
		const finalTrackHabit = learnedTrackHabit !== undefined
			? learnedTrackHabit
			: (finalCat === 'Everyday & Retail' ? false : (learnedCat ? true : autoTrackHabit));
		
		addDoc(collection(db, 'items'), {
			name: newItemName.trim(),
			category: finalCat, 
			store: (learnedStore && learnedStore !== 'Unknown') ? learnedStore : autoStore, 
			inCart: false, 
			trackHabit: finalTrackHabit,
			userId: user.uid,
			createdAt: new Date().toISOString()
		}).catch(() => setToastMessage("Saved offline. Will sync when connection returns."));

		if (analytics) {
			logEvent(analytics, 'item_added', {
				add_method: 'manual_type',
				item_category: finalCat
			});
		}
	};

	const handleToggleCart = (id: string, currentState: boolean) => {
		const item = items.find(i => i.id === id);
		const itemName = item ? item.name : 'Item';
		
		setToastMessage(!currentState ? `Moved ${itemName} to Cart` : `Moved ${itemName} back to List`);
		setHasDismissedReminder(false); 
		setNowTick(Date.now());

		const payload: Partial<GroceryItem> = { inCart: !currentState };
		payload.cartedAt = !currentState ? new Date().toISOString() : null; 
		updateDoc(doc(db, 'items', id), payload);

		if (analytics && !currentState) {
			logEvent(analytics, 'item_checked');
		}
	};

	const handleDeleteItem = (id: string) => {
		deleteDoc(doc(db, 'items', id));
	};

	const handleUpdateItem = (id: string, updates: Partial<GroceryItem>) => {
		setEditingItem(null); 

		const finalUpdates: Partial<GroceryItem> = { ...updates };

		const existingItem = items.find(i => i.id === id);
		const normalizedNewCat = finalUpdates.category ? normalizeCategoryName(finalUpdates.category) : undefined;
		const wasEverydayRetail = existingItem ? normalizeCategoryName(existingItem.category) === 'Everyday & Retail' : false;
		const wasTracked = existingItem ? existingItem.trackHabit !== false : true;

		if (normalizedNewCat === 'Everyday & Retail' && !wasEverydayRetail) {
			const explicitlyToggledOn = finalUpdates.trackHabit === true && !wasTracked;
			if (!explicitlyToggledOn) {
				finalUpdates.trackHabit = false;
			}
		}

		if (user && finalUpdates.name) {
			const nameKey = normalizeItemName(finalUpdates.name);
			const prefPayload: any = { 
				userId: user.uid,
				updatedAt: new Date().toISOString() 
			};
			if (finalUpdates.category) prefPayload.category = normalizeCategoryName(finalUpdates.category);
			if (finalUpdates.store) prefPayload.lastPurchasedStore = finalUpdates.store;
			if (finalUpdates.trackHabit !== undefined) prefPayload.trackHabit = finalUpdates.trackHabit;
			setDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)), prefPayload, { merge: true });
		}
		updateDoc(doc(db, 'items', id), finalUpdates);
	};

	const handleForgetPreference = (name: string) => {
		if (!user) return;
		const nameKey = normalizeItemName(name);
		
		setToastMessage(`Reset default categorization for ${name}`);
		setEditingItem(null);

		deleteDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)));
	};

	const handleFinishRun = () => {
		if (!user) return;
		const cartItems = items.filter(item => item.inCart);
		if (cartItems.length === 0) return;
		const checkoutTime = new Date().toISOString();

		if (analytics) {
			logEvent(analytics, 'run_completed', {
				total_items: cartItems.length,
				list_type: 'standard'
			});
		}

		setHasDismissedReminder(false);
		setExpandedCartStore(null);

		const trackableHabitItems = cartItems
			.filter(item => item.trackHabit !== false)
			.map(item => ({
				name: item.name,
				category: normalizeCategoryName(item.category),
				store: item.store || 'Other',
				trackHabit: true
			}));

		if (trackableHabitItems.length > 0) {
			addDoc(collection(db, 'purchaseHistory'), {
				date: checkoutTime,
				userId: user.uid,
				items: trackableHabitItems
			});
			const count = trackableHabitItems.length;
			setToastMessage(`Run complete. ${count} ${count === 1 ? 'item' : 'items'} added to Habits.`);
		} else {
			setToastMessage("Run complete. All one-time purchases cleared.");
		}

		setActiveTab('habits');

		for (const item of cartItems) {
			const nameKey = normalizeItemName(item.name);
			const prefPayload: any = {
				userId: user.uid,
				category: normalizeCategoryName(item.category),
				lastPurchasedDate: checkoutTime,
				lastPurchasedStore: item.store || 'Other',
				updatedAt: checkoutTime
			};
			if (item.trackHabit !== undefined) {
				prefPayload.trackHabit = item.trackHabit;
			}
			setDoc(doc(db, 'preferences', getPrefDocId(user.uid, nameKey)), prefPayload, { merge: true });
			deleteDoc(doc(db, 'items', item.id));
		}
	};

	// CORE DATA REMOVAL LOGIC (With exact item name support for Toast)
	const executeRemoveHabitItems = async (itemKeys: string[], singleDisplayName?: string) => {
		if (!user || itemKeys.length === 0) return;
		const targetSet = new Set(itemKeys.map(k => normalizeItemName(k)));

		try {
			for (const order of purchaseHistory) {
				if (!order.items || !Array.isArray(order.items)) continue;
				const remainingItems = order.items.filter((i: any) => {
					const norm = normalizeItemName(i.name || '');
					return !targetSet.has(norm);
				});

				if (remainingItems.length !== order.items.length) {
					if (remainingItems.length === 0) {
						await deleteDoc(doc(db, 'purchaseHistory', order.id));
					} else {
						await updateDoc(doc(db, 'purchaseHistory', order.id), { items: remainingItems });
					}
				}
			}

			for (const key of targetSet) {
				setDoc(doc(db, 'preferences', getPrefDocId(user.uid, key)), {
					userId: user.uid,
					trackHabit: false,
					updatedAt: new Date().toISOString()
				}, { merge: true });
			}

			if (itemKeys.length === 1 && singleDisplayName) {
				const formattedName = singleDisplayName.charAt(0).toUpperCase() + singleDisplayName.slice(1);
				setToastMessage(`Removed ${formattedName} from Habits.`);
			} else {
				setToastMessage(`Removed ${itemKeys.length} items from Habits.`);
			}

			setSelectedHabitIds(new Set());
			setIsSelectionMode(false);
			setSwipedCardId(null);
		} catch (err) {
			setToastMessage("Failed to remove items from Habits. Check connection.");
		}
	};

	const handleAddFromHabits = (habit: any, stayOnTab: boolean = false) => {
		if (!user) return;
		const nameKey = normalizeItemName(habit.name);
		const alreadyOnList = items.some(i => normalizeItemName(i.name) === nameKey);
		if (alreadyOnList) {
			setToastMessage(`${habit.name} is already on your list`);
			return;
		}
		
		setToastMessage(`Added ${habit.name} to List`);
		if (!stayOnTab) setActiveTab('list'); 

		const resolvedStore = 
			(habit.lastPurchasedStore && habit.lastPurchasedStore !== 'Unknown' ? habit.lastPurchasedStore : null) ||
			preferences[nameKey]?.lastPurchasedStore ||
			getLatestStoreFromHistory(nameKey) ||
			habit.store ||
			'Other';

		const rawCategory = 
			preferences[nameKey]?.category ||
			habit.category ||
			autoTagItem(habit.name).category;
		const resolvedCategory = normalizeCategoryName(rawCategory);

		addDoc(collection(db, 'items'), {
			name: habit.name, 
			category: resolvedCategory, 
			store: resolvedStore,
			trackHabit: habit.trackHabit !== false,
			userId: user.uid,
			inCart: false, 
			createdAt: new Date().toISOString()
		}).catch(() => setToastMessage("Failed to sync item."));

		if (analytics) {
			logEvent(analytics, 'item_added', {
				add_method: 'predictive',
				item_category: resolvedCategory
			});
		}
	};
	
	const listTabItems = items;
	const cartTabItems = items.filter(item => item.inCart);

	const categoryOrderMap = useMemo(() => {
		return CATEGORIES.reduce((acc, cat, index) => {
			acc[cat.name] = index;
			return acc;
		}, {} as Record<string, number>);
	}, []);

	const allKnownItems = useMemo(() => {
		const set = new Set<string>();
		Object.keys(DEFAULT_VELOCITY).forEach(i => set.add(i));
		items.forEach(i => set.add(i.name.toLowerCase()));
		purchaseHistory.forEach(order => {
			order.items?.forEach((i: GroceryItem) => set.add((i.name || '').toLowerCase()));
		});
		return Array.from(set)
			.filter(Boolean)
			.map(name => name.charAt(0).toUpperCase() + name.slice(1));
	}, [items, purchaseHistory]);

	useEffect(() => {
		if (activeTab !== 'cart' || cartTabItems.length === 0) return;
		setNowTick(Date.now());
		const interval = setInterval(() => setNowTick(Date.now()), 30000);
		return () => clearInterval(interval);
	}, [activeTab, cartTabItems.length]);

	useEffect(() => {
		const checkStaleItems = () => {
			if (cartTabItems.length === 0 || hasDismissedReminder) {
				setShowStaleCartWarning(false);
				return;
			}
			const THREE_HOURS_MS = 10800000; 
			const now = Date.now();
			const hasStale = cartTabItems.some(item => {
				if (!item.cartedAt) return false;
				return (now - new Date(item.cartedAt).getTime()) >= THREE_HOURS_MS;
			});
			setShowStaleCartWarning(hasStale);
		};

		checkStaleItems();
		window.addEventListener('focus', checkStaleItems);
		return () => window.removeEventListener('focus', checkStaleItems);
	}, [cartTabItems, hasDismissedReminder]);

	const groupedByStore = listTabItems.reduce((groups, item) => {
		const rawStore = item.store?.trim() || 'Other';
		const officialStore = STORE_OPTIONS.find(
			s => s.name.toLowerCase() === rawStore.toLowerCase()
		);
		const storeName = officialStore ? officialStore.name : 'Other';

		if (!groups[storeName]) { groups[storeName] = []; }
		groups[storeName].push(item);
		return groups;
	}, {} as Record<string, GroceryItem[]>);

	const cartGroupedByStore = useMemo(() => {
		return cartTabItems.reduce((groups, item) => {
			const rawStore = item.store?.trim() || 'Other';
			const officialStore = STORE_OPTIONS.find(
				s => s.name.toLowerCase() === rawStore.toLowerCase()
			);
			const storeName = officialStore ? officialStore.name : 'Other';

			if (!groups[storeName]) { groups[storeName] = []; }
			groups[storeName].push(item);
			return groups;
		}, {} as Record<string, GroceryItem[]>);
	}, [cartTabItems]);

	const cartStoreNames = useMemo(() => {
		return Object.keys(cartGroupedByStore).sort((storeA, storeB) => {
			const getMinTime = (itemsArray: GroceryItem[]) => {
				const times = itemsArray.map(i => i.cartedAt ? new Date(i.cartedAt).getTime() : Date.now());
				return Math.min(...times);
			};
			return getMinTime(cartGroupedByStore[storeA]) - getMinTime(cartGroupedByStore[storeB]);
		});
	}, [cartGroupedByStore]);

	const cartCategoryBreakdown = useMemo(() => {
		const counts: Record<string, number> = {};
		cartTabItems.forEach(item => {
			const cat = normalizeCategoryName(item.category);
			counts[cat] = (counts[cat] || 0) + 1;
		});
		return Object.entries(counts).sort((a, b) => b[1] - a[1]);
	}, [cartTabItems]);

	useEffect(() => {
		if (expandedCartStore && !cartStoreNames.includes(expandedCartStore)) {
			setExpandedCartStore(null);
		}
	}, [cartStoreNames, expandedCartStore]);

	const cartRunTelemetry = useMemo(() => {
		if (cartTabItems.length === 0) {
			return { isActive: false, isPaused: false, durationLabel: null };
		}

		const validTimestamps = cartTabItems
			.map(i => (i.cartedAt ? new Date(i.cartedAt).getTime() : NaN))
			.filter(t => !isNaN(t));

		if (validTimestamps.length === 0) {
			return { isActive: true, isPaused: false, durationLabel: null };
		}

		const firstCartedTime = Math.min(...validTimestamps);
		const elapsedMs = Math.max(0, nowTick - firstCartedTime);
		const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

		if (elapsedMs >= THREE_HOURS_MS) {
			return { isActive: false, isPaused: true, durationLabel: null };
		}

		const totalMinutes = Math.max(1, Math.round(elapsedMs / 60000));
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		const durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

		return { isActive: true, isPaused: false, durationLabel };
	}, [cartTabItems, nowTick]);

	// UNIFIED HABITS PIPELINE
	const habitsDashboardData = useMemo(() => {
		const itemHistory: Record<string, { itemData: GroceryItem, latestOrderTime: number, history: {date: number, store: string}[], count: number, isTracked: boolean }> = {};
		
		purchaseHistory.forEach(order => {
			if (!order.date || !order.items) return;
			const orderTime = new Date(order.date).getTime();

			const processedInThisOrder = new Set<string>();

			order.items.forEach((item: GroceryItem) => {
				const rawNameKey = (item.name || '').toLowerCase();
				const normalizedKey = normalizeItemName(rawNameKey); 
				
				if (processedInThisOrder.has(normalizedKey)) return;
				processedInThisOrder.add(normalizedKey);

				let currentTrackState = item.trackHabit !== false;
				if (trackingOverrides[normalizedKey] !== undefined) {
					currentTrackState = trackingOverrides[normalizedKey];
				} else if (preferences[normalizedKey] && preferences[normalizedKey].trackHabit !== undefined) {
					currentTrackState = preferences[normalizedKey].trackHabit;
				} else if (item.trackHabit !== undefined) {
					currentTrackState = item.trackHabit;
				}

				if (!currentTrackState) return;

				if (!itemHistory[normalizedKey]) {
					itemHistory[normalizedKey] = { itemData: item, latestOrderTime: orderTime, history: [], count: 0, isTracked: currentTrackState };
				} else {
					itemHistory[normalizedKey].isTracked = currentTrackState;
					if (orderTime >= itemHistory[normalizedKey].latestOrderTime) {
						itemHistory[normalizedKey].itemData = item;
						itemHistory[normalizedKey].latestOrderTime = orderTime;
					}
				}
				
				itemHistory[normalizedKey].history.push({ date: orderTime, store: item.store || 'Unknown' });
				itemHistory[normalizedKey].count += 1; 
			});
		});

		const now = new Date().getTime();

		const dashboard = Object.values(itemHistory).map(record => {
			let daysSinceLast: number | null = null;
			let status: HabitStatus = 'Need Data';
			let progressPercent = 0;
			let rawUrgencyRatio = 0;
			let lastPurchasedStore = 'Unknown';
			let effectiveInterval: number | null = null;
			
			const rawNameKey = record.itemData.name.toLowerCase();
			const itemNameKey = normalizeItemName(rawNameKey);

			// Use canonical title-cased display name if mapped via ITEM_SYNONYM_MAP
			const canonicalDisplayName = ITEM_SYNONYM_MAP[rawNameKey]
				? itemNameKey.replace(/\b\w/g, c => c.toUpperCase())
				: record.itemData.name;

			if (record.history.length > 0) {
				const sortedHistory = [...record.history].sort((a, b) => a.date - b.date);
				const lastPurchase = sortedHistory[sortedHistory.length - 1];
				
				// FIX: Read true historical store from order record first, fallback to preferences only if missing
				lastPurchasedStore = (lastPurchase && lastPurchase.store && lastPurchase.store !== 'Unknown')
					? lastPurchase.store
					: (preferences[itemNameKey]?.lastPurchasedStore || 'Other');

				daysSinceLast = (now - lastPurchase.date) / MS_PER_DAY;

				const distinctEvents: { date: number; store: string }[] = [sortedHistory[0]];
				for (let i = 1; i < sortedHistory.length; i++) {
					if (sortedHistory[i].date - distinctEvents[distinctEvents.length - 1].date >= MIN_CYCLE_GAP_MS) {
						distinctEvents.push(sortedHistory[i]);
					} else {
						distinctEvents[distinctEvents.length - 1] = sortedHistory[i];
					}
				}

				if (distinctEvents.length >= 2) {
					let totalIntervalMs = 0;
					for (let i = 1; i < distinctEvents.length; i++) {
						totalIntervalMs += (distinctEvents[i].date - distinctEvents[i - 1].date);
					}
					const rawIntervalDays = (totalIntervalMs / (distinctEvents.length - 1)) / MS_PER_DAY;
					effectiveInterval = Math.max(rawIntervalDays, 3);

					rawUrgencyRatio = daysSinceLast / effectiveInterval;
					const decayCeilingDays = Math.max(effectiveInterval * 2.5, 14);

					if (daysSinceLast > decayCeilingDays) {
						status = 'Lapsed';
						progressPercent = 0;
					} else if (daysSinceLast >= (effectiveInterval * 0.9)) {
						status = 'Restock Soon';
						progressPercent = Math.min(Math.max(rawUrgencyRatio * 100, 8), 100);
					} else {
						status = 'In Stock';
						progressPercent = Math.min(Math.max(rawUrgencyRatio * 100, 8), 100);
					}
				} else {
					status = 'Need Data';
					progressPercent = 0;
				}
			}

			const savedOrItemCat = preferences[itemNameKey]?.category || record.itemData.category;
			const cleanCategory = (!savedOrItemCat || savedOrItemCat === 'Pantry & Snacks' || savedOrItemCat === 'General')
				? autoTagItem(canonicalDisplayName).category
				: normalizeCategoryName(savedOrItemCat);

			const roundedDaysSince = daysSinceLast !== null ? Math.round(daysSinceLast) : null;
			const roundedAvgCycle = effectiveInterval ? Math.round(effectiveInterval) : null;

			const isFrequentlyPurchased = 
				record.isTracked &&
				record.count >= 5 && 
				status !== 'Lapsed' && 
				status !== 'Need Data' &&
				roundedDaysSince !== null &&
				roundedDaysSince <= 45;

			// Flag items that are >= 3.5x past their normal cycle (min 45 days) as potentially outgrown/unused
			const isOutgrown =
				status === 'Lapsed' &&
				roundedDaysSince !== null &&
				roundedAvgCycle !== null &&
				roundedDaysSince >= Math.max(roundedAvgCycle * 3.5, 45);

			return {
				...record.itemData,
				name: canonicalDisplayName,
				id: itemNameKey,
				category: cleanCategory,
				store: lastPurchasedStore !== 'Unknown' ? lastPurchasedStore : record.itemData.store,
				trackHabit: record.isTracked,
				totalPurchases: record.count,
				avgIntervalDays: roundedAvgCycle,
				daysSinceLast: roundedDaysSince,
				lastPurchasedStore,
				status,
				progressPercent,
				rawUrgencyRatio,
				isFrequentlyPurchased,
				isOutgrown
			};
		});

		return dashboard;
	}, [purchaseHistory, trackingOverrides, preferences]);

	const filteredAndSortedHabits = useMemo(() => {
		let result = habitsDashboardData.filter(habit => 
			habit.name.toLowerCase().includes(habitSearchQuery.toLowerCase().trim())
		);

		const compareByCategoryAndName = (a: any, b: any) => {
			const catA = normalizeCategoryName(a.category);
			const catB = normalizeCategoryName(b.category);
			const orderA = categoryOrderMap[catA] ?? 99;
			const orderB = categoryOrderMap[catB] ?? 99;
			if (orderA !== orderB) return orderA - orderB;
			return a.name.localeCompare(b.name);
		};
		
		result.sort((a, b) => {
			if (habitSortFilter === 'urgency') {
				const statusRank: Record<string, number> = {
					'Restock Soon': 1,
					'In Stock': 2,
					'Lapsed': 3,
					'Need Data': 4
				};
				const rankA = statusRank[a.status] ?? 5;
				const rankB = statusRank[b.status] ?? 5;
				if (rankA !== rankB) return rankA - rankB;

				if (a.status === 'Restock Soon' || a.status === 'In Stock') {
					const cycleA = a.avgIntervalDays ?? 9999;
					const cycleB = b.avgIntervalDays ?? 9999;
					if (cycleA !== cycleB) return cycleA - cycleB;
					if (b.totalPurchases !== a.totalPurchases) return b.totalPurchases - a.totalPurchases;
					if (b.rawUrgencyRatio !== a.rawUrgencyRatio) return b.rawUrgencyRatio - a.rawUrgencyRatio;
				}

				if (a.status === 'Lapsed') {
					const daysA = a.daysSinceLast ?? 9999;
					const daysB = b.daysSinceLast ?? 9999;
					if (daysA !== daysB) return daysA - daysB;
				}

				return compareByCategoryAndName(a, b);

			} else if (habitSortFilter === 'recent') {
				const daysA = a.daysSinceLast !== null ? a.daysSinceLast : 9999;
				const daysB = b.daysSinceLast !== null ? b.daysSinceLast : 9999;
				if (daysA !== daysB) return daysA - daysB;

				const catA = normalizeCategoryName(a.category);
				const catB = normalizeCategoryName(b.category);
				const orderA = categoryOrderMap[catA] ?? 99;
				const orderB = categoryOrderMap[catB] ?? 99;
				if (orderA !== orderB) return orderA - orderB;

				const cycleA = a.avgIntervalDays ?? 9999;
				const cycleB = b.avgIntervalDays ?? 9999;
				if (cycleA !== cycleB) return cycleA - cycleB;

				return a.name.localeCompare(b.name);

			} else if (habitSortFilter === 'frequent') {
				if (b.totalPurchases !== a.totalPurchases) return b.totalPurchases - a.totalPurchases;
				return compareByCategoryAndName(a, b);
			} else if (habitSortFilter === 'az') {
				return a.name.localeCompare(b.name);
			} else if (habitSortFilter === 'category') {
				return compareByCategoryAndName(a, b);
			} else if (habitSortFilter === 'store') {
				const storeCompare = (a.lastPurchasedStore || 'Other').localeCompare(b.lastPurchasedStore || 'Other');
				return storeCompare !== 0 ? storeCompare : compareByCategoryAndName(a, b);
			}
			return 0;
		});
		
		return result;
	}, [habitsDashboardData, habitSearchQuery, habitSortFilter, categoryOrderMap]);

	// TOUCH & MULTI-SELECT HANDLERS
	const handleTouchStart = (habitId: string, e: React.TouchEvent) => {
		if (isSelectionMode) return;
		touchStartXRef.current = e.touches[0].clientX;
		touchStartYRef.current = e.touches[0].clientY;
		isScrollingRef.current = false;

		longPressTimeoutRef.current = setTimeout(() => {
			if (!isScrollingRef.current) {
				if (navigator.vibrate) navigator.vibrate(50);
				setIsSelectionMode(true);
				setSelectedHabitIds(new Set([habitId]));
				setSwipedCardId(null);
			}
		}, 500);
	};

	const handleTouchMove = (habitId: string, e: React.TouchEvent) => {
		const diffX = e.touches[0].clientX - touchStartXRef.current;
		const diffY = e.touches[0].clientY - touchStartYRef.current;

		if (Math.abs(diffY) > 8) {
			isScrollingRef.current = true;
			if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
		}

		if (isSelectionMode || isScrollingRef.current) return;

		if (diffX < -50) {
			if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
			setSwipedCardId(habitId);
		} else if (diffX > 30) {
			if (swipedCardId === habitId) setSwipedCardId(null);
		}
	};

	const handleTouchEnd = () => {
		if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
	};

	const toggleSelectCard = (id: string) => {
		setSelectedHabitIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			if (next.size === 0) {
				setIsSelectionMode(false);
			} else {
				setIsSelectionMode(true);
				setSwipedCardId(null);
			}
			return next;
		});
	};

	const isAllSelected = filteredAndSortedHabits.length > 0 && selectedHabitIds.size === filteredAndSortedHabits.length;

	const handleSelectAll = () => {
		if (isAllSelected) {
			setSelectedHabitIds(new Set());
			setIsSelectionMode(false);
		} else {
			setIsSelectionMode(true);
			setSwipedCardId(null);
			setSelectedHabitIds(new Set(filteredAndSortedHabits.map(h => h.id)));
		}
	};

	// UNIFIED STORE LOGO RENDERER (Matches List Tab Store Logos & Enlarges Shoppers/FreshCo)
	const renderHabitStoreLogo = (rawStoreName?: string) => {
		const cleanName = rawStoreName?.trim() || 'Other';
		const officialStore = STORE_OPTIONS.find(
			s => s.name.toLowerCase() === cleanName.toLowerCase()
		);

		if (officialStore?.imageLogo) {
			return (
				<div className="mt-1 flex items-center h-7">
					<img 
						src={officialStore.imageLogo} 
						alt={officialStore.name} 
						className={`${officialStore.logoClass || 'h-6 sm:h-7 max-w-[135px]'} object-contain object-left`} 
						onError={(e) => { 
							e.currentTarget.style.display = 'none';
							const parent = e.currentTarget.parentElement;
							if (parent && !parent.querySelector('.fallback-text')) {
								const span = document.createElement('span');
								span.className = 'inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-headline font-bold uppercase tracking-wider truncate max-w-full bg-white border-slate-200 text-slate-700 fallback-text';
								span.innerText = officialStore.logo || officialStore.name || cleanName;
								parent.insertBefore(span, parent.firstChild);
							}
						}}
					/>
				</div>
			);
		}

		return (
			<div className="mt-1 flex items-center">
				<span className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-headline font-bold uppercase tracking-wider truncate max-w-full ${officialStore?.color || 'bg-white border-slate-200 text-slate-700'}`}>
					{officialStore?.logo || officialStore?.name || cleanName}
				</span>
			</div>
		);
	};

	const suggestedReplenishments = useMemo(() => {
		return habitsDashboardData
			.filter(habit => {
				if (!habit.trackHabit) return false;
				if (habit.status !== 'Restock Soon') return false;
				const rawKey = habit.name.toLowerCase();
				const normKey = normalizeItemName(rawKey);
				if (dismissedSuggestions.has(rawKey) || dismissedSuggestions.has(normKey)) return false;
				const alreadyOnList = items.some(i => normalizeItemName(i.name) === normKey);
				return !alreadyOnList;
			})
			.sort((a, b) => (a.avgIntervalDays ?? 999) - (b.avgIntervalDays ?? 999));
	}, [habitsDashboardData, items, dismissedSuggestions]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#EBF7EE]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15803d] mx-auto"></div>
					<p className="mt-4 text-[#15803d] font-medium">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return <Auth />;
	}

	return (
		<Layout 
			activeTab={activeTab} 
			setActiveTab={setActiveTab} 
			userEmail={user.email}
			cartCount={cartTabItems.length}
		>
			
			{showStaleCartWarning && (
				<div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
					<div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl overflow-hidden p-4">
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
								<span className="material-symbols-outlined text-red-600">shopping_cart_checkout</span>
							</div>
							<div className="flex-1">
								<h3 className="font-headline font-bold text-red-900 text-lg">Unfinished Checkout</h3>
								<p className="text-red-700 text-sm mt-0.5 leading-tight">
									You left {cartTabItems.length} items in your cart.
								</p>
								<div className="flex gap-2 mt-3">
									<button 
										type="button"
										onClick={() => {
											setHasDismissedReminder(true);
											setActiveTab('cart');
										}}
										className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-sm active:scale-95 transition-transform"
									>
										View Cart
									</button>
									<button 
										type="button"
										onClick={() => setHasDismissedReminder(true)}
										className="flex-1 bg-red-100 text-red-800 font-bold py-2 rounded-xl text-sm active:scale-95 transition-transform"
									>
										Dismiss
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="w-full flex flex-col gap-6 mt-4 pb-32">
				
				{activeTab === 'list' && (
					<>
						<div className="flex flex-col gap-4">
							<AddItemForm onAddItem={handleAddItem} suggestions={allKnownItems} />
							<AddForm onAddItem={handleAddItem} />
						</div>

						{suggestedReplenishments.length > 0 && (
							<div className="mb-6 p-4 bg-white/50 backdrop-blur-md border border-primary/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(23,106,33,0.05)]">
								<div className="flex items-center gap-2 mb-3">
									<span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">auto_awesome</span>
									<h3 className="font-headline font-bold text-slate-800 tracking-tight">You might be running out of:</h3>
								</div>
								<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
									{suggestedReplenishments.map(item => (
										<div 
											key={`suggest-${item.id}`}
											className="flex items-center bg-transparent rounded-full border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
										>
											<button 
												type="button"
												onClick={() => handleAddFromHabits(item, true)}
												aria-label={`Add suggested item ${item.name} to list`}
												className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 whitespace-nowrap"
											>
												<Icon icon={getItemIcon(item.name, item.category)} className="text-lg" aria-hidden="true" />
												<span>{item.name}</span>
												<span className="material-symbols-outlined text-[14px] text-primary/60 ml-0.5" aria-hidden="true">add_circle</span>
											</button>
											<button 
												type="button"
												onClick={() => handleDismissSuggestion(item.name)}
												className="pr-3 pl-1 py-2 text-slate-400 hover:text-red-500 transition-colors flex items-center"
												aria-label={`Dismiss ${item.name} suggestion`}
											>
												<span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{listTabItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center pt-16 pb-8 text-center px-4 animate-fade-in">
								<div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6" aria-hidden="true">
									<span className="material-symbols-outlined text-5xl text-on-surface-variant/40">shopping_cart</span>
								</div>
								<h3 className="text-xl font-headline font-bold text-on-surface mb-2">Your list is empty</h3>
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{Object.keys(groupedByStore).sort().map((storeName) => {
									const itemsInStore = groupedByStore[storeName];
									const officialStore = STORE_OPTIONS.find(s => s.name.toLowerCase() === storeName.toLowerCase());
									
									const storeHeader = officialStore?.imageLogo ? (
										<div className={`flex items-center px-4 py-3.5 rounded-xl border shadow-sm ${officialStore.color || 'bg-white border-slate-200'}`}>
											<img 
												src={officialStore.imageLogo}
												alt={storeName} 
												className={`${officialStore.logoClass || 'h-7 sm:h-8 max-w-[140px] sm:max-w-[160px]'} object-contain object-left`} 
												onError={(e) => { 
													// Fallback: hide broken image and show store name text instead
													e.currentTarget.style.display = 'none';
													const parent = e.currentTarget.parentElement;
													if (parent && !parent.querySelector('.fallback-text')) {
														const span = document.createElement('span');
														span.className = 'font-headline font-bold uppercase tracking-wider text-sm sm:text-base text-slate-800 fallback-text';
														span.innerText = officialStore.logo || officialStore.name || storeName;
														parent.insertBefore(span, parent.firstChild);
													}
												}}
											/>
											<div className="ml-auto bg-white/85 text-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/60 flex items-center justify-center backdrop-blur-sm">
												<span className="text-xs font-bold">{itemsInStore.length}</span>
											</div>
										</div>
									) : (
										<div className={`flex items-center px-4 py-3.5 rounded-xl border shadow-sm font-headline font-bold uppercase tracking-wider text-sm sm:text-base ${officialStore?.color || 'bg-white text-slate-600 border-slate-200'}`}>
											<span>{officialStore?.logo || officialStore?.name || storeName || 'Other'}</span>
											<div className="ml-auto bg-white/85 text-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/60 flex items-center justify-center backdrop-blur-sm">
												<span className="text-xs font-bold">{itemsInStore.length}</span>
											</div>
										</div>
									);
									
									const sortedItems = [...itemsInStore].sort((a, b) => {
										const orderA = categoryOrderMap[normalizeCategoryName(a.category)] ?? 99;
										const orderB = categoryOrderMap[normalizeCategoryName(b.category)] ?? 99;
										return orderA - orderB;
									});

									return (
										<div key={storeName} className="mb-6 flex flex-col gap-3">
											{storeHeader}
											<div className="flex flex-col gap-2">
												{sortedItems.map((item: GroceryItem) => (
													<ItemCard 
														key={item.id} 
														id={item.id} 
														name={item.name} 
														category={normalizeCategoryName(item.category)} 
														inCart={item.inCart} 
														viewMode="list" 
														trackHabit={item.trackHabit}
														onToggleCart={handleToggleCart} 
														onDelete={handleDeleteItem} 
														onEdit={() => setEditingItem(item)} 
													/>
												))}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</>
				)}

				{activeTab === 'cart' && (
					<div className="flex flex-col gap-4 mt-1 animate-fade-in">
						<section className="px-1">
							<h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight leading-none">
								Run Summary
							</h2>
							{cartTabItems.length > 0 && (
								<div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-slate-600 font-medium">
									{cartRunTelemetry.isPaused ? (
										<span className="inline-flex items-center text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-semibold">
											<span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" aria-hidden="true"></span>
											Run Paused
										</span>
									) : (
										<span className="inline-flex items-center text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-semibold">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true"></span>
											Cart Active
										</span>
									)}

									<span>-</span>
									<span>
										{cartStoreNames.length} {cartStoreNames.length === 1 ? 'Store' : 'Stores'}
									</span>

									{cartRunTelemetry.durationLabel && (
										<>
											<span>-</span>
											<span className="inline-flex items-center gap-1 font-semibold text-slate-700">
												<span className="material-symbols-outlined text-[14px] text-emerald-700" aria-hidden="true">schedule</span>
												{cartRunTelemetry.durationLabel}
											</span>
										</>
									)}
								</div>
							)}
						</section>

						{cartTabItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center pt-16 pb-8 text-center px-4 animate-fade-in">
								<div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6" aria-hidden="true">
									<span className="material-symbols-outlined text-5xl text-on-surface-variant/40">shopping_cart_checkout</span>
								</div>
								<h3 className="text-xl font-headline font-bold text-on-surface mb-2">Your cart is empty</h3>
								<p className="text-sm text-slate-500 max-w-xs">
									Check off items from your List as you shop to review your run summary here.
								</p>
							</div>
						) : (
							<>
								<section className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100 shrink-0" aria-hidden="true">
												<span className="material-symbols-outlined text-xl">shopping_cart</span>
											</div>
											<div>
												<div className="text-sm font-headline font-bold text-slate-900">Cart Overview</div>
												<div className="text-xs text-slate-500 font-medium mt-0.5">
													{cartTabItems.length} {cartTabItems.length === 1 ? 'item' : 'items'} ready across {cartStoreNames.length} {cartStoreNames.length === 1 ? 'store' : 'stores'}
												</div>
											</div>
										</div>
										<span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shrink-0">
											{cartStoreNames.length} {cartStoreNames.length === 1 ? 'Store' : 'Stores'}
										</span>
									</div>

									{cartCategoryBreakdown.length > 0 && (
										<div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100">
											{cartCategoryBreakdown.map(([catName, count]) => (
												<span 
													key={catName} 
													className={`inline-flex items-center gap-1 text-[10px] font-label font-bold px-2 py-0.5 rounded-md border ${getCategoryBgColor(catName)}`}
												>
													<Icon icon={getCategoryIcon(catName)} className="text-[13px] shrink-0" aria-hidden="true" />
													<span>{catName}: {count}</span>
												</span>
											))}
										</div>
									)}
								</section>

								<div className="flex flex-col gap-3">
									{cartStoreNames.map((storeName) => {
										const itemsInStore = cartGroupedByStore[storeName];
										const officialStore = STORE_OPTIONS.find(
											s => s.name.toLowerCase() === storeName.toLowerCase()
										);
										const isExpanded = expandedCartStore === storeName;

										const sortedStoreItems = [...itemsInStore].sort((a, b) => {
											const orderA = categoryOrderMap[normalizeCategoryName(a.category)] ?? 99;
											const orderB = categoryOrderMap[normalizeCategoryName(b.category)] ?? 99;
											return orderA - orderB;
										});

										return (
											<div 
												key={storeName} 
												className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
													isExpanded ? 'ring-2 ring-primary/20' : ''
												} ${officialStore?.color || 'bg-white border-slate-200'}`}
											>
												<button
													type="button"
													aria-expanded={isExpanded}
													aria-label={`${storeName} cart items, ${itemsInStore.length} ${itemsInStore.length === 1 ? 'item' : 'items'}`}
													onClick={() => setExpandedCartStore(isExpanded ? null : storeName)}
													className="w-full px-4 py-3.5 flex items-center justify-between text-left select-none hover:brightness-95 transition-all"
												>
													<div className="flex items-center gap-3 min-w-0">
														{officialStore?.imageLogo ? (
															<img 
																src={officialStore.imageLogo}
																alt={storeName} 
																className={`${officialStore.logoClass || 'h-7 sm:h-8 max-w-[140px]'} object-contain object-left shrink-0`} 
																onError={(e) => { 
																	e.currentTarget.style.display = 'none';
																	const parent = e.currentTarget.parentElement;
																	if (parent && !parent.querySelector('.fallback-text')) {
																		const span = document.createElement('span');
																		span.className = 'font-headline font-bold uppercase tracking-wider text-sm sm:text-base text-slate-800 fallback-text';
																		span.innerText = officialStore.logo || officialStore.name || storeName;
																		parent.insertBefore(span, parent.firstChild);
																	}
																}}
															/>
														) : (
															<span className="font-headline font-bold uppercase tracking-wider text-sm sm:text-base shrink-0">
																{officialStore?.logo || officialStore?.name || storeName}
															</span>
														)}
													</div>

													<div className="flex items-center gap-2 shrink-0 ml-auto">
														<span className="bg-white/85 text-slate-900 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm border border-slate-200/60 backdrop-blur-sm">
															{itemsInStore.length} {itemsInStore.length === 1 ? 'item' : 'items'}
														</span>
														<span 
															aria-hidden="true"
															className={`w-7 h-7 rounded-full bg-white/85 shadow-sm flex items-center justify-center text-slate-700 transition-transform duration-200 shrink-0 ${
																isExpanded ? 'rotate-180 text-primary' : ''
															}`}
														>
															<span className="material-symbols-outlined text-[18px]">expand_more</span>
														</span>
													</div>
												</button>

												{isExpanded && (
													<div className="border-t border-slate-200/50 p-3 flex flex-col gap-2 bg-white/50 backdrop-blur-md">
														{sortedStoreItems.map((item: GroceryItem) => (
															<ItemCard 
																key={item.id} 
																id={item.id} 
																name={item.name} 
																category={normalizeCategoryName(item.category)} 
																inCart={item.inCart} 
																viewMode="cart" 
																trackHabit={item.trackHabit}
																onToggleCart={handleToggleCart} 
																onDelete={handleDeleteItem} 
															/>
														))}
													</div>
												)}
											</div>
										);
									})}
								</div>

								<div className="pt-2 pb-4">
									<button 
										type="button"
										onClick={handleFinishRun}
										className="w-full py-4 px-6 bg-[#00A86B] hover:bg-[#059669] text-white rounded-2xl font-headline font-extrabold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
									>
										<span className="material-symbols-outlined text-xl" aria-hidden="true">check_circle</span>
										<span>Finish Run</span>
									</button>
								</div>
							</>
						)}
					</div>
				)}

				{activeTab === 'habits' && (
					<div className="w-full flex flex-col gap-5 animate-fade-in pb-16">
						<section>
							<div className="flex flex-col gap-3 mb-4">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-headline font-bold text-slate-900">Habits Dashboard</h2>
									<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
										{habitsDashboardData.length} {habitsDashboardData.length === 1 ? 'item' : 'items'} tracked
									</span>
								</div>

								{/* BATCH SELECTION CONTROL BAR / HOW IT WORKS BANNER */}
								{isSelectionMode ? (
									<div className="bg-white rounded-2xl p-3 shadow-sm border border-emerald-800/10 flex flex-col gap-2">
										<div className="flex items-center justify-between">
											<button 
												type="button"
												onClick={() => {
													setIsSelectionMode(false);
													setSelectedHabitIds(new Set());
												}}
												className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 transition-colors"
											>
												Cancel
											</button>
											<div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
												<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
												<span className="text-xs font-bold text-emerald-800 tracking-tight">
													{selectedHabitIds.size} {selectedHabitIds.size === 1 ? 'Item' : 'Items'} Selected
												</span>
											</div>
											<button 
												type="button"
												onClick={handleSelectAll}
												className={`text-xs font-bold flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
													isAllSelected 
														? 'bg-emerald-600 text-white border-emerald-600' 
														: 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 border-emerald-200/60'
												}`}
											>
												{isAllSelected && (
													<span className="material-symbols-outlined text-[14px]" aria-hidden="true">check</span>
												)}
												<span>Select All ({filteredAndSortedHabits.length})</span>
											</button>
										</div>
										<p className="text-[11px] text-slate-500 text-center font-medium leading-tight px-1">
											Select cards in any order to remove them from Habits.
										</p>
									</div>
								) : (
									<div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-[#1E40AF] shadow-xs">
										<span className="material-symbols-outlined text-blue-600 text-[18px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">auto_awesome</span>
										<p className="leading-snug text-[12px]">
											<strong className="font-bold">How it works:</strong> Habits predicts when you run out of an item based on its purchase frequency.
											<span className="md:hidden"> Long-press any card to select multiple items, or swipe left to remove an item.</span>
											<span className="hidden md:inline"> Hover over any card to click the trash icon to remove it, or select the checkbox to remove multiple items.</span>
										</p>
									</div>
								)}

								<div className="flex items-center space-x-2 mt-1">
									<div className="relative flex-1">
										<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" aria-hidden="true">search</span>
										<input 
											type="text"
											aria-label="Search tracked items"
											placeholder="Find tracked item..."
											value={habitSearchQuery}
											onChange={(e) => setHabitSearchQuery(e.target.value)}
											className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 shadow-xs"
										/>
										{habitSearchQuery && (
											<button 
												type="button"
												aria-label="Clear search"
												onClick={() => setHabitSearchQuery('')}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
											>
												<span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
											</button>
										)}
									</div>
									<div className="relative">
										<select
											aria-label="Sort tracked habits by"
											value={habitSortFilter}
											onChange={(e) => setHabitSortFilter(e.target.value)}
											className="bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 shadow-xs appearance-none outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
										>
											<option value="urgency">Restock Urgency</option>
											<option value="recent">Recently Bought</option>
											<option value="frequent">Most Bought</option>
											<option value="category">Category</option>
											<option value="store">Store</option>
											<option value="az">Alphabetical (A-Z)</option>
										</select>
										<span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]" aria-hidden="true">
											
										</span>
									</div>
								</div>
							</div>

							{/* HABIT CARDS STREAM */}
							<div className="flex flex-col gap-3.5">
								{filteredAndSortedHabits.map((habit) => {
									const isAlreadyOnList = listTabItems.some(i => normalizeItemName(i.name) === normalizeItemName(habit.name));
									const displayHabitCat = normalizeCategoryName(habit.category);
									const isSelected = selectedHabitIds.has(habit.id);
									const isSwiped = swipedCardId === habit.id;
									
									const getTrackedButtonConfig = () => {
										if (isAlreadyOnList) {
											return {
												label: 'Added to List',
												className: 'bg-emerald-100 text-emerald-800 text-xs font-bold'
											};
										}
										if (habit.status === 'Restock Soon') {
											return {
												label: 'Restock Soon',
												className: 'bg-rose-100 text-rose-800 text-xs font-bold'
											};
										}
										if (habit.status === 'Lapsed') {
											return {
												label: 'Buy Again',
												className: 'bg-slate-100 text-slate-700 text-xs font-bold'
											};
										}
										if (habit.status === 'Need Data') {
											return {
												label: 'Need Data',
												className: 'bg-[#FEF3C7] text-amber-900 text-xs font-bold'
											};
										}
										return {
											label: 'In Stock',
											className: 'bg-[#E5F4E9] text-emerald-900 text-xs font-bold'
										};
									};

									const trackedBtn = getTrackedButtonConfig();

									return (
										<div 
											key={habit.id}
											className="group relative overflow-hidden rounded-3xl select-none"
										>
											{/* REVEALED MOBILE SWIPE ACTION PANEL (Hidden on desktop and during selection mode) */}
											<div 
												onClick={() => {
													if (!isSelectionMode) {
														setSingleRemoveModalItem(habit);
													}
												}}
												className={`md:hidden absolute inset-0 bg-[#DC2626] rounded-3xl flex items-center justify-end z-0 cursor-pointer active:brightness-90 transition-all ${
													isSelectionMode ? 'hidden' : ''
												}`}
											>
												<div className="w-[140px] px-2 flex flex-col items-center justify-center text-white text-center space-y-1">
													<div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-xs" aria-hidden="true">
														<span className="material-symbols-outlined text-white text-xl">delete</span>
													</div>
													<span className="text-[11px] font-bold tracking-tight leading-tight">Remove from Habits</span>
													<span className="text-[9px] text-white/85 font-medium leading-tight">Clears history &amp; predictions</span>
												</div>
											</div>

											{/* FRONT CARD SURFACE (Always 100% opaque bg-white) */}
											<article 
												onTouchStart={(e) => handleTouchStart(habit.id, e)}
												onTouchMove={(e) => handleTouchMove(habit.id, e)}
												onTouchEnd={handleTouchEnd}
												onClick={() => {
													if (isSelectionMode) {
														toggleSelectCard(habit.id);
													} else if (isSwiped) {
														setSwipedCardId(null);
													}
												}}
												className={`relative bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 z-10 p-4 ${
													isSelectionMode ? 'cursor-pointer' : ''
												} ${
													!isSelectionMode && isSwiped ? '-translate-x-[140px]' : 'translate-x-0'
												} ${
													isSelectionMode && isSelected 
														? 'border-2 border-emerald-500 ring-2 ring-emerald-500/15' 
														: isSelectionMode 
														? 'border-2 border-slate-200/80' 
														: 'border border-slate-100/90'
												}`}
											>
												{/* TOP ROW: Checkbox + Emoji + Title + Status Pill + Desktop Trash Icon */}
												<div className="flex items-center justify-between mb-3 gap-2">
													<div className="flex items-center space-x-2.5 min-w-0 flex-1">
														{/* Circular Checkbox: Always visible in selection mode; reveals on card hover on desktop */}
														<div 
															onClick={(e) => {
																e.stopPropagation();
																toggleSelectCard(habit.id);
															}}
															title="Select item"
															className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
																isSelectionMode 
																	? (isSelected 
																		? 'bg-emerald-600 text-white shadow-xs' 
																		: 'border-2 border-slate-300 bg-white hover:border-emerald-500')
																	: 'hidden md:flex opacity-0 group-hover:opacity-100 border-2 border-slate-300 bg-white hover:border-emerald-500 text-transparent hover:text-emerald-600/40'
															}`}
														>
															<span className="material-symbols-outlined text-[14px] font-bold" aria-hidden="true">check</span>
														</div>

														<div className="flex items-center space-x-2 min-w-0">
															<span className="text-xl shrink-0" aria-hidden="true">
																<Icon icon={getItemIcon(habit.name, displayHabitCat)} className="text-xl" />
															</span>
															<h2 className="text-lg font-bold text-slate-900 capitalize truncate">
																{habit.name}
															</h2>
														</div>
													</div>

													<div className="flex items-center gap-1.5 shrink-0">
														<button 
															type="button"
															aria-label={isAlreadyOnList ? `${habit.name} is already on your list` : `Add ${habit.name} to list (${trackedBtn.label})`}
															onClick={(e) => {
																if (isSelectionMode) return;
																e.stopPropagation();
																handleAddFromHabits(habit, true);
															}}
															disabled={!isSelectionMode && isAlreadyOnList}
															className={`px-3 py-1 rounded-full flex items-center space-x-1 transition-all shrink-0 ${
																isSelectionMode ? 'pointer-events-none' : 'active:scale-95'
															} ${trackedBtn.className}`}
														>
															<span>{trackedBtn.label}</span>
															<span className="material-symbols-outlined text-xs font-bold" aria-hidden="true">
																{isAlreadyOnList ? 'check' : 'add'}
															</span>
														</button>

														{/* DESKTOP SUBTLE HOVER TRASH ICON */}
														{!isSelectionMode && (
															<button
																type="button"
																title="Remove from Habits"
																aria-label={`Remove ${habit.name} from Habits`}
																onClick={(e) => {
																	e.stopPropagation();
																	setSingleRemoveModalItem(habit);
																}}
																className="hidden md:inline-flex w-8 h-8 rounded-full items-center justify-center text-slate-400 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
															>
																<span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
															</button>
														)}
													</div>
												</div>

												{/* 2X2 METRIC GRID BOX */}
												<div className="bg-[#F8FAF9] rounded-2xl p-3 border border-slate-100 grid grid-cols-2 gap-y-2.5 gap-x-4 mb-3">
													<div>
														<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Purchases</span>
														<span className="text-base font-extrabold text-slate-800">{habit.totalPurchases}</span>
													</div>
													<div>
														<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Avg Cycle</span>
														<span className="text-base font-extrabold text-slate-800">
															{habit.avgIntervalDays ? `${habit.avgIntervalDays}d` : '--'}
														</span>
													</div>
													<div>
														<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Last Bought</span>
														<span className="text-base font-extrabold text-slate-800">
															{habit.daysSinceLast !== null ? `${habit.daysSinceLast}d ago` : '--'}
														</span>
													</div>
													<div className="min-w-0">
														<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Store</span>
														{renderHabitStoreLogo(habit.lastPurchasedStore)}
													</div>
												</div>

												{/* ACCURATE CATEGORY & FREQUENTLY PURCHASED BADGES */}
												<div className="flex items-center flex-wrap gap-2 mb-3">
													<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCategoryBgColor(displayHabitCat)}`}>
														<Icon icon={getCategoryIcon(displayHabitCat)} className="text-[14px] shrink-0" aria-hidden="true" />
														<span>{displayHabitCat}</span>
													</span>

													{habit.isFrequentlyPurchased && (
														<span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FEF4D5] text-amber-900 border border-amber-200/80 text-xs font-semibold">
															<span className="material-symbols-outlined text-[14px]" aria-hidden="true">bolt</span>
															<span>Frequently Purchased</span>
														</span>
													)}
												</div>

												{/* CADENCE PROGRESS INDICATOR */}
												{(habit.status === 'Restock Soon' || habit.status === 'In Stock') && (
													<div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
														<div 
															className={`h-full rounded-full transition-all ${
																habit.status === 'Restock Soon' ? 'bg-rose-500' : 'bg-emerald-500'
															}`} 
															style={{ width: `${habit.progressPercent}%` }}
														/>
													</div>
												)}

												{habit.status === 'Need Data' && (
													<div className="flex items-start space-x-1.5 text-xs text-amber-800 font-medium">
														<span className="material-symbols-outlined text-amber-600 text-sm mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">info</span>
														<span>Complete one more purchase to get restock predictions</span>
													</div>
												)}

												{habit.status === 'Lapsed' && (
													<div className="flex flex-col gap-2">
														<div className="flex items-start space-x-1.5 text-xs text-slate-500 font-medium">
															<span className="material-symbols-outlined text-slate-400 text-sm mt-0.5 shrink-0" aria-hidden="true">history</span>
															<span>
																Predictions paused (past {habit.avgIntervalDays}d cycle) — log a purchase to restart tracking
															</span>
														</div>

														{habit.isOutgrown && !isSelectionMode && (
															<div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 mt-0.5">
																<span className="text-[11px] text-slate-600 font-medium">
																	No longer buying this item?
																</span>
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		setSingleRemoveModalItem(habit);
																	}}
																	className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
																>
																	<span>Remove from Habits</span>
																</button>
															</div>
														)}
													</div>
												)}
											</article>
										</div>
									);
								})}

								{filteredAndSortedHabits.length === 0 && (
									<div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
										<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
											<span className="material-symbols-outlined text-3xl text-slate-400">monitoring</span>
										</div>
										<h3 className="font-bold text-slate-800 mb-2">No habit data yet</h3>
										<p className="text-sm text-slate-600">
											Complete grocery runs with routine items to populate restock predictions.
										</p>
									</div>
								)}
							</div>
						</section>
					</div>
				)}
			</div>

			{/* FLOATING BATCH ACTION DOCK */}
			{isSelectionMode && selectedHabitIds.size > 0 && (
				<div className="fixed bottom-[68px] inset-x-3 z-40 animate-fade-in pointer-events-auto">
					<div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-700/60 text-white flex flex-col items-center max-w-[400px] mx-auto">
						<div className="flex items-center space-x-2 mb-1">
							<div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center" aria-hidden="true">
								<span className="material-symbols-outlined text-xs">delete</span>
							</div>
							<span className="text-sm font-bold tracking-tight">
								{selectedHabitIds.size} {selectedHabitIds.size === 1 ? 'item' : 'items'} selected for removal
							</span>
						</div>
						<p className="text-[11px] text-slate-300 font-normal mb-2.5">
							Clears purchase history &amp; turns off restock predictions.
						</p>
						<div className="w-full flex gap-2">
							<button 
								type="button"
								onClick={() => {
									setIsSelectionMode(false);
									setSelectedHabitIds(new Set());
								}}
								className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all active:scale-[0.98]"
							>
								Cancel
							</button>
							<button 
								type="button"
								onClick={() => setBatchRemoveModalVisible(true)}
								className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
							>
								<span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
								<span className="text-sm">Remove Selected Items ({selectedHabitIds.size})</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* SINGLE ITEM REMOVE CONFIRMATION MODAL */}
			{singleRemoveModalItem && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
					onClick={() => {
						setSingleRemoveModalItem(null);
						setSwipedCardId(null);
					}}
				>
					<div 
						className="bg-white text-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto" aria-hidden="true">
							<span className="material-symbols-outlined text-2xl">delete</span>
						</div>

						<div className="text-center">
							<h3 className="text-lg font-headline font-bold text-slate-900 capitalize">
								Remove {singleRemoveModalItem.name} from Habits?
							</h3>
							<p className="text-xs text-slate-500 mt-2 leading-relaxed">
								This will clear its past purchase history and restock predictions. It will not be removed from your active shopping list if present.
							</p>
						</div>

						<div className="flex flex-col gap-2 pt-2">
							<button 
								type="button"
								onClick={() => {
									executeRemoveHabitItems([singleRemoveModalItem.id], singleRemoveModalItem.name);
									setSingleRemoveModalItem(null);
								}}
								className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95"
							>
								Remove from Habits
							</button>
							<button 
								type="button"
								onClick={() => {
									setSingleRemoveModalItem(null);
									setSwipedCardId(null);
								}}
								className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* BATCH REMOVE CONFIRMATION MODAL */}
			{batchRemoveModalVisible && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
					onClick={() => setBatchRemoveModalVisible(false)}
				>
					<div 
						className="bg-white text-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto" aria-hidden="true">
							<span className="material-symbols-outlined text-2xl">delete_sweep</span>
						</div>

						<div className="text-center">
							<h3 className="text-lg font-headline font-bold text-slate-900">
								Remove {selectedHabitIds.size} {selectedHabitIds.size === 1 ? 'Item' : 'Items'} from Habits?
							</h3>
							<p className="text-xs text-slate-500 mt-2 leading-relaxed">
								This will clear purchase history and restock predictions for all selected items. They will not be removed from your active shopping list if present.
							</p>
						</div>

						<div className="flex flex-col gap-2 pt-2">
							<button 
								type="button"
								onClick={() => {
									executeRemoveHabitItems(Array.from(selectedHabitIds));
									setBatchRemoveModalVisible(false);
								}}
								className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95"
							>
								Remove from Habits
							</button>
							<button 
								type="button"
								onClick={() => setBatchRemoveModalVisible(false)}
								className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{editingItem && (
				<EditModal 
					item={editingItem} 
					onClose={() => setEditingItem(null)} 
					onSave={handleUpdateItem} 
					onForget={handleForgetPreference}
				/>
			)}

			<Toast 
				message={toastMessage || ''} 
				isVisible={!!toastMessage} 
				onClose={() => setToastMessage(null)} 
			/>
			<Analytics />
		</Layout>
	);
}