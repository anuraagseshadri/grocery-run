// src/components/EditModal.tsx

import React, { useState } from 'react';
import { GroceryItem } from '../app/types';
import { CATEGORIES, normalizeCategoryName, getCategoryIcon, getCategoryBgColor } from '../constants';
import { Icon } from '@iconify/react';

interface EditModalProps {
  item: GroceryItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<GroceryItem>) => void;
  onForget: (name: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave, onForget }) => {
  const [name, setName] = useState(item.name);
  const initialCategory = normalizeCategoryName(item.category);
  const [category, setCategory] = useState(initialCategory);
  const [store, setStore] = useState(item.store || 'Other');
  const [trackHabit, setTrackHabit] = useState<boolean>(item.trackHabit !== false);

  const handleSelectStore = (selectedStore: string) => {
    setStore(prev => (prev === selectedStore ? 'Other' : selectedStore));
  };

  const handleSave = () => {
    onSave(item.id, { name: name.trim(), category, store: store || 'Other', trackHabit });
  };

  const getActiveRingClass = (storeName: string) => {
    return store === storeName
      ? 'ring-2 ring-[#059669] ring-offset-2 ring-offset-white scale-[1.02] shadow-md z-10'
      : 'hover:brightness-95 opacity-95 hover:opacity-100';
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in"
      onClick={onClose} 
    >
      <div 
        className="bg-white text-slate-900 rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-3 shrink-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Item</h2>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close dialog"
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex flex-col gap-6 px-6 py-2 overflow-y-auto flex-1">
          {/* Item Name Input */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="p-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-0 focus:border-emerald-500 outline-none text-slate-800 font-semibold transition-all"
            />
          </div>

          {/* Tracking Mode Selector */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <button 
              type="button"
              onClick={() => setTrackHabit(true)}
              className={`relative flex flex-col justify-between text-left p-3.5 rounded-2xl transition active:scale-[0.98] ${
                trackHabit !== false 
                  ? 'bg-[#F0FDF4] border-2 border-[#10B981] shadow-xs' 
                  : 'bg-white border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm font-bold text-slate-900">Track Item</span>
                {trackHabit !== false && (
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <p className={`text-[11px] leading-snug font-medium ${trackHabit !== false ? 'text-slate-600' : 'text-slate-400'}`}>
                Calculates cycles &amp; restock predictions in Habits
              </p>
            </button>

            <button 
              type="button"
              onClick={() => setTrackHabit(false)}
              className={`relative flex flex-col justify-between text-left p-3.5 rounded-2xl transition active:scale-[0.98] ${
                trackHabit === false 
                  ? 'bg-[#F0FDF4] border-2 border-[#10B981] shadow-xs' 
                  : 'bg-white border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm font-bold text-slate-900">One time</span>
                {trackHabit === false && (
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <p className={`text-[11px] leading-snug font-medium ${trackHabit === false ? 'text-slate-600' : 'text-slate-400'}`}>
                Single run only, never logs to Habits
              </p>
            </button>
          </div>

          {/* Store Selector Logo Pill Grid */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">STORE</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center w-full">
              
              {/* 1. Real Canadian Superstore */}
              <button
                type="button"
                onClick={() => handleSelectStore('Real Canadian Superstore')}
                title="Real Canadian Superstore"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('Real Canadian Superstore')}`}
              >
                <div className="flex items-center justify-center gap-1.5 leading-none">
                  <span className="w-4 h-4 rounded-xs bg-[#003da5] flex items-center justify-center text-white shrink-0">
                    <svg viewBox="0 0 512 512" className="w-3 h-3 fill-[#da291c]">
                      <path d="M256 16l32 80 56-24-16 64 64 8-32 56 64 40-72 32 8 48-72-16-16 56h-32l-16-56-72 16 8-48-72-32 64-40-32-56 64-8-16-64 56 24z M240 384h32v112h-32z" />
                    </svg>
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[8.5px] font-black text-[#003da5] tracking-tight leading-none uppercase">REAL CANADIAN</span>
                    <span className="text-[10px] font-black text-[#da291c] tracking-tight leading-none uppercase mt-0.5">SUPERSTORE</span>
                  </div>
                </div>
              </button>

              {/* 2. Costco */}
              <button
                type="button"
                onClick={() => handleSelectStore('Costco')}
                title="Costco"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('Costco')}`}
              >
                <svg className="h-6 w-auto max-w-[110px]" fill="none" viewBox="208.5 290.5 201 72">
                  <g fill="#E31837">
                    <path d="M314.348 316.81l6.799-.255-5.705 18.799h12.199l5.703-18.799 6.646.255 2.708-8.926h-25.644l-2.706 8.926zm-25.259 4.881c-1.706 8.815-11.052 14.099-21.292 14.099-10.239 0-17.542-5.283-15.836-14.099 1.67-8.635 11.125-14.244 21.32-14.244 10.194 0 17.478 5.61 15.808 14.244zm-24.87.146c-.605 3.133 1.562 5.283 5.255 5.283 3.695 0 6.693-2.149 7.299-5.283.564-2.914-1.368-5.354-5.241-5.354-3.873-.002-6.749 2.44-7.313 5.354z" />
                    <path d="M285.298 333.276c3.481 1.565 8.195 2.514 12.424 2.514 7.257 0 15.185-3.242 16.453-9.8.902-4.663-2.399-6.922-7.381-7.869l-2.662-.51c-.9-.183-2.385-.328-2.188-1.349.218-1.129 1.84-1.458 2.909-1.458 2.625 0 4.81.911 6.676 2.077l4.654-7.031c-2.978-1.639-6.346-2.403-10.175-2.403-7.301 0-15.263 3.643-16.524 10.164-.832 4.299 2.731 6.594 7.36 7.287l2.378.363c1.078.184 2.66.292 2.42 1.53s-2.231 1.639-3.434 1.639c-2.805 0-5.213-1.129-7.126-2.513l-.545-.401-5.239 7.76zm81.145-24.7c-2.44-.729-5.213-1.129-7.974-1.129-9.838 0-18.78 6.412-20.331 14.427-1.516 7.833 4.787 13.917 14.359 13.917 2.18 0 6.784-.328 8.893-1.093l2.344-10.273c-2.264 1.566-4.678 2.55-7.483 2.55-3.649 0-6.36-2.332-5.774-5.354.578-2.988 4.02-5.355 7.67-5.355 2.76 0 4.961 1.275 6.633 2.77l1.663-10.46zm19.532-1.129c-10.194 0-19.649 5.609-21.32 14.244-1.705 8.815 5.598 14.099 15.838 14.099 10.238 0 19.586-5.283 21.291-14.099 1.668-8.634-5.616-14.244-15.809-14.244zm-1.748 9.034c3.873 0 5.806 2.44 5.24 5.354-.605 3.133-3.604 5.283-7.299 5.283s-5.861-2.149-5.255-5.283c.564-2.912 3.441-5.354 7.314-5.354zm-129.121-14.07c-3.045-.881-6.501-1.365-9.944-1.365-12.271 0-23.424 7.75-25.357 17.438-1.889 9.468 5.971 16.821 17.908 16.821 2.721 0 8.464-.396 11.091-1.32l2.923-12.419c-2.821 1.894-5.834 3.083-9.333 3.083-4.553 0-7.932-2.819-7.203-6.475.721-3.61 5.013-6.474 9.565-6.474 3.442 0 6.188 1.542 8.271 3.347l2.079-12.636z" />
                  </g>
                  <path d="M220.658 351.367h57.093l-.004-.02h-.047l-.722-3.14h-56.32zm0-4.488h56.014l-.728-3.159h-55.286zm0-4.507h54.958l-.247-1.151-.505-2.197h-54.206z" fill="#005DAA" />
                </svg>
              </button>

              {/* 3. Walmart */}
              <button
                type="button"
                onClick={() => handleSelectStore('Walmart')}
                title="Walmart"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('Walmart')}`}
              >
                <svg className="h-4.5 w-auto max-w-[95px]" fill="none" viewBox="55 91 252.998 59.874">
                  <g>
                    <path d="m 292.405,118.279 c 1.246,-0.257 12.263,-5.316 13.246,-5.885 2.245,-1.299 3.014,-4.176 1.718,-6.425 -1.297,-2.25 -4.168,-3.021 -6.412,-1.722 -0.984,0.569 -10.864,7.601 -11.708,8.553 -0.968,1.092 -1.135,2.653 -0.419,3.895 0.716,1.243 2.148,1.878 3.575,1.584 z" fill="#ffc220" />
                    <path d="m 305.651,129.48 c -0.984,-0.568 -12.001,-5.628 -13.246,-5.884 -1.427,-0.295 -2.859,0.34 -3.575,1.583 -0.716,1.243 -0.549,2.805 0.419,3.895 0.844,0.952 10.725,7.985 11.708,8.553 2.245,1.3 5.116,0.528 6.412,-1.721 1.296,-2.25 0.526,-5.127 -1.718,-6.426 z" fill="#ffc220" />
                    <path d="m 281.499,129.421 c -1.432,0 -2.698,0.926 -3.157,2.311 -0.4,1.21 -1.537,13.3 -1.537,14.438 0,2.597 2.101,4.704 4.694,4.704 2.593,0 4.694,-2.106 4.694,-4.704 0,-1.138 -1.137,-13.229 -1.538,-14.438 -0.459,-1.386 -1.724,-2.311 -3.156,-2.311 z" fill="#ffc220" />
                    <path d="m 270.591,123.596 c -1.244,0.256 -12.263,5.315 -13.245,5.884 -2.246,1.3 -3.014,4.177 -1.718,6.426 1.296,2.25 4.167,3.021 6.412,1.721 0.983,-0.569 10.863,-7.601 11.708,-8.553 0.968,-1.092 1.135,-2.652 0.419,-3.895 -0.716,-1.242 -2.149,-1.878 -3.576,-1.583 z" fill="#ffc220" />
                    <path d="m 262.039,104.247 c -2.245,-1.299 -5.116,-0.528 -6.411,1.722 -1.297,2.25 -0.527,5.127 1.717,6.425 0.984,0.569 12.001,5.628 13.246,5.885 1.427,0.294 2.86,-0.34 3.576,-1.584 0.716,-1.242 0.548,-2.804 -0.419,-3.895 -0.845,-0.952 -10.725,-7.984 -11.709,-8.553 z" fill="#ffc220" />
                    <path d="m 281.499,91 c -2.592,0 -4.694,2.1056 -4.694,4.7041 0,1.1377 1.137,13.2289 1.537,14.4389 0.459,1.386 1.725,2.311 3.157,2.311 1.432,0 2.697,-0.926 3.156,-2.311 0.401,-1.21 1.538,-13.3002 1.538,-14.4389 0,-2.5975 -2.101,-4.7041 -4.694,-4.7041 z" fill="#ffc220" />
                  </g>
                  <g fill="#0053e2">
                    <path d="M 90.8044,104 86.4281,125.765 81.518,104 H 72.9903 L 68.0801,125.765 63.7065,104 H 55 l 7.0996,33.247 h 10.1319 l 4.9562,-22.075 4.9562,22.075 h 9.9097 L 99.1072,104 Z" />
                    <path d="m 108.594,132.637 c -1.965,0 -3.035,-1.197 -3.035,-2.836 0,-2.128 1.696,-2.97 3.839,-3.724 1.117,-0.417 2.236,-0.85 2.992,-1.506 v 3.678 c 0,2.793 -1.474,4.388 -3.794,4.388 m 1.16,-22.518 c -5.403,0 -9.197,1.819 -10.5815,3.102 v 7.093 c 1.6065,-1.418 4.9995,-3.501 9.4655,-3.501 2.766,0 3.793,0.754 3.793,2.306 0,1.329 -1.428,1.862 -5.403,2.704 -6.026,1.241 -9.5085,3.415 -9.5085,8.6 0,4.787 3.1705,7.58 7.7685,7.58 3.851,0 6.152,-1.774 7.412,-4.158 v 3.404 h 8.302 v -16.314 c 0,-7.491 -3.929,-10.816 -11.251,-10.816" />
                    <path d="m 132.73,104 h -8.617 v 33.247 h 8.617 z" />
                    <path d="m 167.31,110.208 c -4.181,0 -6.883,2.494 -8.295,5.817 -0.758,-3.56 -3.276,-5.817 -6.796,-5.817 -3.986,0 -6.584,2.308 -7.901,5.55 v -4.797 h -8.482 v 26.288 h 8.617 v -14.583 c 0,-3.59 1.206,-5.629 3.794,-5.629 2.097,0 2.813,1.418 2.813,3.635 v 16.58 h 8.617 v -14.584 c 0,-3.589 1.205,-5.629 3.793,-5.629 2.098,0 2.813,1.418 2.813,3.635 v 16.581 h 8.617 v -17.783 c 0,-5.541 -2.634,-9.264 -7.59,-9.264 z" />
                    <path d="m 187.846,132.637 c -1.964,0 -3.035,-1.197 -3.035,-2.836 0,-2.128 1.697,-2.97 3.84,-3.724 1.117,-0.417 2.236,-0.85 2.992,-1.506 v 3.678 c 0,2.793 -1.474,4.388 -3.797,4.388 z m 1.16,-22.518 c -5.403,0 -9.197,1.819 -10.582,3.102 v 7.093 c 1.607,-1.418 5,-3.501 9.466,-3.501 2.766,0 3.793,0.754 3.793,2.306 0,1.329 -1.428,1.862 -5.403,2.704 -6.026,1.241 -9.509,3.415 -9.509,8.6 0,4.787 3.171,7.58 7.769,7.58 3.851,0 6.152,-1.774 7.412,-4.158 v 3.404 h 8.302 v -16.314 c 0,-7.491 -3.929,-10.816 -11.251,-10.816" />
                    <path d="m 211.641,118.387 v -7.426 h -8.438 v 26.288 h 8.617 v -11.172 c 0,-5.142 3.214,-6.517 6.295,-6.517 1.027,0 2.008,0.132 2.455,0.267 v -9.044 c -4.848,-0.231 -7.793,2.842 -8.929,7.604 z" />
                    <path d="m 237,117.61 v -6.649 h -5.49 v -5.099 h -8.617 v 22.607 c 0,6.34 3.614,9.31 9.375,9.31 2.68,0 4.108,-0.533 4.732,-0.931 v -6.606 c -0.491,0.356 -1.296,0.622 -2.323,0.622 -1.918,0.043 -3.17,-0.799 -3.17,-3.589 v -9.665 h 5.49 z" />
                  </g>
                </svg>
              </button>

              {/* 4. No Frills */}
              <button
                type="button"
                onClick={() => handleSelectStore('No Frills')}
                title="No Frills"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-[#FFD200] border border-amber-400 shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('No Frills')}`}
              >
                <svg className="h-3.5 w-auto max-w-[95px]" fill="none" viewBox="0 0 118 16.5">
                  <g transform="translate(4.3353861,-309.1028)">
                    <g transform="translate(0.26458927,-0.26457737)">
                      <path d="M 10.692947,309.89654 H 2.9671138 -4.3353861 v 7.51417 c 0,4.15396 3.36020825,7.51417 7.5141665,7.51417 h 7.5141666 z" fill="#003da5" />
                      <polygon fill="#da291c" points="30.6,10.1 33.6,15.8 36.8,14.8 35.3,23.9 40,20 41.1,22.3 45.9,21.7 44.8,27.4 46.6,28.7 38.9,35.8 39.2,38.8 32.2,38.3 32.1,40.2 32.2,47 30.5,47.1 28.7,47.1 29,40.1 29,38.3 21.8,38.9 22.3,35.8 14.5,28.9 16.1,27.3 14.9,21.1 20,22.2 21,20 25.6,24.4 24.1,14.7 27.5,15.7" transform="matrix(0.26458333,0,0,0.26458333,-4.5470528,309.47321)" />
                      <polygon fill="#221F1F" points="223.4,17.9 223.4,25.4 238.6,25.4 238.6,40.2 223.4,40.2 223.4,58.4 202.6,58.4 202.6,1.6 240.7,1.6 240.7,17.9" transform="matrix(0.26458333,0,0,0.26458333,-4.5470528,309.47321)" />
                      <rect fill="#221F1F" height="15.054791" width="5.4768753" x="73.822533" y="309.89655" />
                      <path d="m 70.118363,318.94529 c 1.905,-0.66146 2.725208,-1.64041 2.725208,-3.83646 0,-3.78354 -2.883958,-5.23875 -6.270625,-5.23875 h -6.614583 v 15.0548 h 5.344583 v -4.81542 h 0.105834 l 1.799166,4.84187 h 6.297084 z m -4.418542,-2.38125 h -0.370416 v -2.56646 h 0.423333 c 0.926042,0 1.74625,0.1323 1.74625,1.29646 0,1.11125 -0.899583,1.27 -1.799167,1.27" fill="#221F1F" />
                      <polygon fill="#221F1F" points="356.4,58.4 356.4,40.2 343.3,40.2 343.3,1.6 322.6,1.6 322.6,58.4" transform="matrix(0.26458333,0,0,0.26458333,-4.5470528,309.47321)" />
                      <path d="m 107.00128,315.50571 -1.24354,-0.29104 c -0.42334,-0.10584 -1.08479,-0.18521 -1.08479,-0.74084 0,-0.60854 0.68791,-0.79375 1.16416,-0.79375 1.16417,0 2.24896,0.34396 3.175,0.97896 l 1.48167,-3.70416 c -1.48167,-0.89959 -3.04271,-1.32292 -4.7625,-1.32292 -3.28083,0 -6.535209,1.98437 -6.535209,5.55625 0,2.35479 1.799169,3.62479 3.942289,3.99521 l 1.08479,0.21166 c 0.50271,0.10584 1.21709,0.15875 1.21709,0.84667 0,0.68792 -0.84667,0.89958 -1.40229,0.89958 -1.27,0 -2.43417,-0.15875 -3.41313,-0.92604 l -0.13229,-0.10583 v 4.84187 c 1.50812,0.0529 2.19604,0.23813 3.54542,0.23813 l -0.0265,-0.0265 c 0.15875,0 0.3175,0.0265 0.44979,0.0265 3.25437,0 6.53521,-1.77271 6.53521,-5.37104 0,-2.56646 -1.69334,-3.81 -3.99521,-4.31271" fill="#221F1F" />
                      <polygon fill="#221F1F" points="393.6,58.4 393.6,40.2 380.4,40.2 380.4,1.6 359.7,1.6 359.7,58.4" transform="matrix(0.26458333,0,0,0.26458333,-4.5470528,309.47321)" />
                      <path d="m 39.955863,309.65842 c -4.577291,0 -8.334375,3.06916 -8.334375,7.80521 0,4.84187 3.730625,7.72583 8.334375,7.72583 4.577292,0 8.334375,-2.88396 8.334375,-7.72583 0,-4.73605 -3.757083,-7.80521 -8.334375,-7.80521 m 0,10.76854 c -1.666875,0 -2.804583,-1.19063 -2.804583,-2.88396 0,-1.5875 1.084792,-2.93687 2.804583,-2.93687 1.74625,0 2.804584,1.34937 2.804584,2.93687 0.02646,1.69333 -1.137709,2.88396 -2.804584,2.88396" fill="#da291c" />
                      <path d="m 25.40378,309.89654 v 2.64584 0 5.18583 l -4.630208,-7.83167 h -5.23875 v 15.05479 h 5.23875 v -4.89479 c 0,-0.0265 0,-0.0529 0,-0.0794 v -2.64584 l 4.630208,7.62 h 5.23875 v -15.05479 z" fill="#da291c" />
                    </g>
                  </g>
                </svg>
              </button>

              {/* 5. FreshCo */}
              <button
                type="button"
                onClick={() => handleSelectStore('FreshCo')}
                title="FreshCo"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-[#bfd730] border border-[#a6bd22] shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('FreshCo')}`}
              >
                <svg className="h-7 w-auto max-w-[110px]" fill="none" viewBox="0 0 214 68">
                  <path d="M32.53 19.458c.388 0 .646.302.646.603v6.505c0 .388-.258.646-.646.646H21.588v3.92h8.659c.387 0 .603.303.56.561l-.603 6.031c-.043.258-.345.56-.733.56h-7.883v10.297c0 .3-.302.603-.647.603h-7.625c-.345 0-.603-.345-.603-.647V20.061c0-.301.258-.603.603-.603H32.53zM61.31 48.494c.215.388-.087.69-.474.69h-9.22c-.43 0-.818-.302-.99-.69l-4.48-9.391h-.518v9.478c0 .3-.301.603-.689.603h-7.582c-.345 0-.646-.302-.646-.603V20.104c0-.344.301-.646.646-.646H48.73c6.635 0 11.029 3.877 11.029 9.736 0 3.403-2.068 6.85-5.3 8.229l6.85 11.071zM48.17 31.78c1.465 0 2.456-.905 2.456-2.283 0-1.379-.991-2.284-2.456-2.284h-2.542v4.567h2.542zM84.705 41.43c.345 0 .647.258.647.559v6.592c0 .3-.302.603-.647.603H64.673c-.302 0-.603-.345-.69-.647V20.061c0-.388.216-.603.604-.603h19.601c.388 0 .69.302.69.603v6.505c0 .388-.302.646-.69.646H72.944v3.404h9.133c.388 0 .603.302.56.56l-.603 6.031c-.043.258-.344.56-.732.56h-8.358v3.662h11.761zM91.341 40.137c.13-.43.431-.56.776-.345 1.981 1.12 4.35 1.938 5.988 2.068 1.378 0 2.283-.646 2.283-1.637 0-2.542-12.106-2.412-12.106-11.804 0-5.773 4.352-9.607 10.9-9.607 3.058 0 6.936 1.249 9.65 3.102.344.215.474.56.344.775l-2.714 6.074c-.129.431-.43.56-.775.345-2.111-1.206-4.567-2.11-6.075-2.24-1.335 0-2.196.603-2.196 1.551 0 2.541 12.191 2.37 12.191 11.847 0 5.73-4.437 9.564-11.071 9.564-3.62 0-7.41-1.12-9.564-2.843-.345-.259-.474-.56-.345-.776l2.714-6.074zM136.879 19.458c.387 0 .646.302.646.646v28.477c0 .3-.259.603-.646.603h-8.056a.616.616 0 0 1-.603-.603v-9.65h-6.032v9.65c0 .3-.258.603-.646.603h-8.056c-.302 0-.603-.302-.603-.603V20.104c0-.344.301-.646.603-.646h8.056c.388 0 .646.302.646.646v11.244h6.032V20.104c0-.344.258-.646.603-.646h8.056zM169.923 46.556c.13.302-.043.603-.387.775-2.5 1.55-5.86 2.499-9.047 2.499-8.875 0-14.82-6.204-14.82-15.509s5.945-15.51 14.82-15.51c3.188 0 6.548.949 9.047 2.5.344.172.517.474.387.775l-2.843 5.988c-.172.388-.474.517-.818.345-1.594-.905-3.145-1.207-4.998-1.207-3.877 0-6.462 2.844-6.462 7.11s2.585 7.107 6.462 7.107c1.853 0 3.404-.302 4.998-1.206.344-.172.646-.043.818.345l2.843 5.988zM185.782 18.815c-8.564 0-15.505 6.943-15.505 15.506s6.941 15.505 15.505 15.505 15.505-6.942 15.505-15.505c0-8.564-6.942-15.506-15.505-15.506zm9.254 13.956-8.85 10.962a.507.507 0 0 1-.394.198.507.507 0 0 1-.393-.198l-8.85-10.962a.706.706 0 0 1-.102-.678c.086-.23.28-.378.495-.378h4.956V26.06c0-.413.339-.752.752-.752h6.284c.414 0 .752.339.752.752v5.656h4.956c.215 0 .41.149.495.378a.706.706 0 0 1-.101.678z" fill="#231f20" />
                </svg>
              </button>

              {/* 6. Shoppers Drug Mart */}
              <button
                type="button"
                onClick={() => handleSelectStore('Shoppers Drug Mart')}
                title="Shoppers Drug Mart"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs active:scale-95 transition-all flex items-center justify-center ${getActiveRingClass('Shoppers Drug Mart')}`}
              >
                <svg className="h-4.5 w-auto max-w-[115px]" fill="none" viewBox="0 0 243 54">
                  <path d="M230.167,39.354c-9.037,9.035-21.89,10.837-28.709,4.017c-6.818-6.816-5.02-19.675,4.019-28.713 c9.037-9.04,21.896-10.838,28.71-4.02C241.007,17.456,239.208,30.314,230.167,39.354" fill="#63B5E6" />
                  <path d="M226.535,42.465h-18.202c-0.791,0-1.491-0.508-1.736-1.262c-0.241-0.751,0.021-1.574,0.658-2.043 l5.589-4.069c1.162-0.846,2.899-0.056,2.899,1.475c0,0.566-0.258,1.119-0.748,1.479c0,0-0.73,0.532-1.056,0.767 c3.766,0,6.44,0,10.109,0c-5.347-4.101-16.183-12.421-16.183-12.421c-0.405-0.315-0.715-0.788-0.715-1.517 c0-0.938,0.851-1.758,1.745-1.758h20.479c0.981,0,1.791,0.836,1.791,1.823c0,0.656-0.339,1.13-0.671,1.407l-5.362,4.463 c-0.776,0.647-1.925,0.54-2.574-0.237c-0.284-0.337-0.421-0.753-0.421-1.162c0-0.526,0.225-1.045,0.657-1.407 c0,0,0.892-0.742,1.484-1.234-3.707,0-6.063,0-9.926,0c4.842,3.716,14.368,10.974,16.095,12.301 C229.824,39.827,227.47,41.95,226.535,42.465 M208.977,17.839h20.362c1.009,0,1.826,0.816,1.826,1.829 c0,1.007-0.817,1.821-1.826,1.821h-20.362c-1.009,0-1.826-0.814-1.826-1.821C207.151,18.655,207.968,17.839,208.977,17.839z" fill="#FFFFFF" />
                  <path d="M78.359,32.669h4.117c1.573,0.012,3.956,0.039,5.602,1.151c1.337,0.913,1.85,2.287,1.85,3.657 c0,0.843-0.167,1.472-0.329,1.885c-1.192,3.024-4.798,3.076-6.151,3.093h-5.088 M81.616,34.733v5.754h0.993 c1.717-0.028,4.097-0.099,4.097-2.912c0-0.68-0.091-1.358-0.678-1.97c-0.882-0.888-2.125-0.872-3.112-0.872H81.616z" fill="#D62025" />
                  <path d="M91.75,32.674h6.371c3.374,0,4.7,1.47,4.7,3.126c0,1.969-1.774,2.503-2.651,2.753l2.982,3.908h-3.57 l-2.562-3.489h-2.032v3.489H91.75 M94.988,34.502v2.65h2.671c0.459-0.017,1.942-0.041,1.942-1.345c0-1.249-1.19-1.289-1.866-1.306 H94.988z" fill="#D62025" />
                  <path d="M164.962,32.674h6.372c3.373,0,4.702,1.47,4.702,3.126c0,1.969-1.773,2.503-2.654,2.753l2.982,3.908h-3.569 l-2.562-3.489h-2.032v3.489h-3.239 M168.202,34.502v2.65h2.675c0.454-0.017,1.94-0.041,1.94-1.345c0-1.249-1.192-1.289-1.867-1.306 H168.202z" fill="#D62025" />
                  <path d="M115.525,32.669v5.462c-0.019,0.943-0.038,1.886-0.753,2.773c-1.39,1.689-4.265,1.774-4.813,1.774 c-0.971,0-2.124-0.181-3.002-0.53c-2.486-0.97-2.486-2.688-2.472-4.018v-5.462h3.26v6.099c0,0.501,0.017,0.915,0.237,1.222 c0.403,0.51,1.281,0.662,2.088,0.662c2.194,0,2.194-1.136,2.214-1.899v-6.083" fill="#D62025" />
                  <path d="M126.89,41.541c-0.527,0.375-1.624,1.138-3.799,1.138c-3.604,0-5.82-2.22-5.82-5.104 c0-3.144,2.693-5.243,6.368-5.243c3.418,0,5.08,1.67,5.685,2.265l-2.448,1.122c-0.461-0.526-1.21-1.388-2.999-1.388 c-2.452,0-3.386,1.539-3.386,3.176c0,1.111,0.402,2.01,1.028,2.496c0.494,0.402,1.37,0.706,2.357,0.706 c0.58,0,1.239-0.108,1.772-0.374c0.842-0.414,0.95-0.943,1.039-1.458h-2.886v-1.854h5.617v5.434h-2.529" fill="#D62025" />
                  <path d="M149.765,32.669v9.786h-3.094l0.201-6.974l0.034-0.984l-0.106,0.346c-0.168,0.556-0.185,0.626-0.333,1.041 l-2.435,6.571h-2.779l-2.342-6.294l-0.566-1.745c0.055,0.776,0.055,0.94,0.107,1.869l0.164,6.17h-3.09v-9.786h4.685l1.977,5.487 l0.458,1.568c0.18-0.681,0.201-0.748,0.344-1.209l2.071-5.847" fill="#D62025" />
                  <path d="M159.034,32.67l4.761,9.785h-3.442l-0.644-1.565h-4.756l-0.642,1.565h-3.438l4.795-9.785 M157.292,34.995 c-0.163,0.501-0.347,1.014-0.53,1.513c-0.272,0.733-0.767,1.884-1.06,2.618h3.278L157.292,34.995z" fill="#D62025" />
                  <polyline fill="#D62025" points="176.449,32.669 187.516,32.669 187.516,34.61 183.608,34.61 183.608,42.469 180.365,42.469 180.365,34.61 176.449,34.61" />
                  <polyline fill="#D62025" points="28.762,11.09 35.828,11.09 35.828,17.355 42.578,17.355 42.578,11.09 49.71,11.09 49.71,28.302 42.578,28.302 42.578,21.673 35.828,21.673 35.828,28.302 28.762,28.302" />
                  <path d="M76.046,19.528c0,4.361-3.327,9.335-12.104,9.335c-9.161,0-11.917-5.217-11.917-9.143 c0-4.925,3.96-9.267,12.04-9.267C72.911,10.454,76.046,15.431,76.046,19.528 M59.122,19.695c0,2.999,1.584,4.801,4.943,4.801 c2.854,0,4.849-1.729,4.849-4.968c0-0.832-0.09-1.588-0.408-2.271c-1.08-2.391-3.803-2.461-4.44-2.461 C61.532,14.796,59.122,16.138,59.122,19.695z" fill="#D62025" />
                  <path d="M78.356,11.09h12.801c2.441,0.07,4.566,0.145,6.371,1.581c1.648,1.344,1.871,2.927,1.871,4.025 c0,1.437-0.38,2.999-2.126,4.39c-1.868,1.485-3.931,1.562-6.369,1.607h-5.452v5.608h-7.096 M85.452,14.696v4.389h4.061 c0.381-0.025,0.789-0.025,1.171-0.121c1.077-0.268,1.71-1.048,1.71-2.095c0-2.022-2.058-2.123-2.947-2.173H85.452z" fill="#D62025" />
                  <path d="M101.376,11.09h12.803c2.443,0.07,4.566,0.145,6.369,1.581c1.652,1.344,1.873,2.927,1.873,4.025 c0,1.437-0.377,2.999-2.123,4.39c-1.869,1.485-3.931,1.562-6.37,1.607h-5.452v5.608h-7.1 M108.476,14.696v4.389h4.056 c0.38-0.025,0.793-0.025,1.175-0.121c1.078-0.268,1.711-1.048,1.711-2.095c0-2.022-2.061-2.123-2.948-2.173H108.476z" fill="#D62025" />
                  <polyline fill="#D62025" points="124.391,11.09 142.094,11.09 142.094,14.866 131.487,14.866 131.487,17.429 141.395,17.429 141.395,21.159 131.487,21.159 131.487,24.571 143.045,24.571 143.045,28.302 124.391,28.302" />
                  <path d="M145.283,11.089h11.153c2.124,0,4.151,0.074,5.516,0.514c2.979,0.976,3.864,3.317,3.864,4.969 c0,2.532-1.68,3.992-4.594,4.783l5.454,6.946h-7.862l-4.343-6.069h-2.091v6.069h-7.098 M152.38,14.672v4.024h2.951 c1.17,0,3.42-0.051,3.42-2c0-1.974-2.223-2.024-3.456-2.024H152.38z" fill="#D62025" />
                  <path d="M171.61,22.351c1.32,1.929,4.357,2.269,6.396,2.269c1.201,0,3.209-0.27,3.209-1.292 c0-0.538-0.403-0.92-1.391-1.081c-0.742-0.118-4.576-0.757-5.677-0.94c-3.907-0.656-6.09-2.424-6.09-5.023 c0-3.602,4.067-5.756,9.89-5.756c4.184,0,7.906,1.033,10.051,3.05l-4.439,2.854c-1.085-1.258-3.521-1.757-5.861-1.757 c-1.207,0-2.539,0.248-2.539,1.118c0,0.832,1.151,1.006,3.078,1.32c4.959,0.821,9.922,1.34,9.922,5.607 c0,3.501-3.721,6.098-10.558,6.098c-4.622,0-8.54-0.915-11.411-3.781" fill="#D62025" />
                  <path d="M9.952,22.351c1.32,1.929,4.353,2.269,6.394,2.269c1.201,0,3.208-0.27,3.208-1.292 c0-0.538-0.402-0.92-1.386-1.081c-0.745-0.118-4.577-0.757-5.677-0.94c-3.909-0.656-6.093-2.424-6.093-5.023 c0-3.602,4.065-5.756,9.893-5.756c4.178,0,7.901,1.033,10.047,3.05L21.9,16.43c-1.086-1.258-3.525-1.757-5.861-1.757 c-1.206,0-2.539,0.248-2.539,1.118c0,0.832,1.151,1.006,3.078,1.32c4.961,0.821,9.918,1.34,9.918,5.607 c0,3.501-3.717,6.098-10.555,6.098c-4.621,0-8.537-0.915-11.41-3.781" fill="#D62025" />
                </svg>
              </button>

              {/* 7. Farmers' Market (Inline Canadian Maple Leaf Vector) */}
              <button
                type="button"
                onClick={() => handleSelectStore("Farmers' Market")}
                title="Farmers' Market"
                className={`w-full h-12 px-2.5 py-1.5 rounded-full bg-white border-2 border-[#D80621] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${getActiveRingClass("Farmers' Market")}`}
              >
                <svg viewBox="0 0 512 512" className="w-4 h-4 shrink-0 fill-[#D80621]" aria-hidden="true">
                  <path d="M256 16l32 80 56-24-16 64 64 8-32 56 64 40-72 32 8 48-72-16-16 56h-32l-16-56-72 16 8-48-72-32 64-40-32-56 64-8-16-64 56 24z M240 384h32v112h-32z" />
                </svg>
                <span className="font-bold tracking-tight text-[#D80621] text-[11px] leading-tight text-center">
                  Farmers&apos; Market
                </span>
              </button>

              {/* 8. Asian Grocery */}
              <button
                type="button"
                onClick={() => handleSelectStore('Asian Grocery')}
                title="Asian Grocery"
                style={{ background: 'linear-gradient(180deg, #E82207 0%, #D11200 100%)' }}
                className={`w-full h-12 px-2.5 py-1.5 rounded-full border-2 border-[#FFC700] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${getActiveRingClass('Asian Grocery')}`}
              >
                <span className="text-[10px] font-bold leading-none px-1.5 py-0.5 rounded bg-[#8C0F05]/50 text-[#FFDE00] shrink-0">
                  亚洲
                </span>
                <span className="font-bold tracking-tight text-[#FFDD00] text-[11px] leading-tight text-center">
                  Asian Grocery
                </span>
              </button>

              {/* 9. Indian Grocery */}
              <button
                type="button"
                onClick={() => handleSelectStore('Indian Grocery')}
                title="Indian Grocery"
                style={{ background: 'linear-gradient(90deg, #F8A566 0%, #FFFFFF 48%, #41AA52 100%)' }}
                className={`w-full h-12 px-2.5 py-1.5 rounded-full border border-slate-300 shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${getActiveRingClass('Indian Grocery')}`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" fill="none" r="9" stroke="#000080" strokeWidth="1.8" />
                  <circle cx="12" cy="12" fill="#000080" r="1.5" />
                  <g stroke="#000080" strokeWidth="1">
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
                    <line x1="5.64" y1="18.36" x2="18.36" y2="5.64" />
                    <line x1="7.5" y1="4.02" x2="16.5" y2="19.98" />
                    <line x1="4.02" y1="7.5" x2="19.98" y2="16.5" />
                    <line x1="7.5" y1="19.98" x2="16.5" y2="4.02" />
                    <line x1="4.02" y1="16.5" x2="19.98" y2="7.5" />
                    <line x1="9.48" y1="3.25" x2="14.52" y2="20.75" />
                    <line x1="3.25" y1="9.48" x2="20.75" y2="14.52" />
                    <line x1="9.48" y1="20.75" x2="14.52" y2="3.25" />
                    <line x1="3.25" y1="14.52" x2="20.75" y2="9.48" />
                  </g>
                </svg>
                <span className="font-bold tracking-tight text-[#0E1B38] text-[11px] leading-tight text-center">
                  Indian Grocery
                </span>
              </button>

              {/* 10. Other */}
              <button
                type="button"
                onClick={() => handleSelectStore('Other')}
                title="Other"
                className={`w-full h-12 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 ${getActiveRingClass('Other')}`}
              >
                <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="font-semibold text-xs">Other</span>
              </button>

            </div>
          </div>

          {/* Category Grid */}
          <div className="flex flex-col gap-2 shrink-0 pt-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CATEGORY</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c.name;
                const colorClass = getCategoryBgColor(c.name);
                return (
                  <button
                    key={`cat-${c.name}`}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected 
                        ? 'border-[#059669] ring-2 ring-[#059669]/30 shadow-xs ' + colorClass 
                        : 'border-slate-100 opacity-85 hover:opacity-100 hover:border-slate-200 ' + colorClass
                    }`}
                  >
                    <Icon icon={getCategoryIcon(c.name)} className="text-2xl drop-shadow-xs" />
                    <span className="text-[11px] font-bold tracking-wide text-center leading-tight">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md flex justify-between items-center px-6 py-4 border-t border-slate-100 shrink-0 shadow-lg">
          <button 
            type="button"
            onClick={() => {
              setStore('Other');
              onForget(item.name);
            }} 
            className="text-sm font-semibold text-[#E05656] hover:opacity-80 px-2 py-2 transition-opacity shrink-0"
            title="Reset saved store and category preferences for this item"
          >
            Reset Category
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="button"
              onClick={handleSave} 
              className="px-7 py-2.5 bg-[#D5E7D8] text-[#1C4E2B] rounded-full text-sm font-bold shadow-xs hover:brightness-95 transition-all active:scale-95"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};