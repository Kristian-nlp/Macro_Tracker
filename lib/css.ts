// "The Grid" design system, injected once as a scoped <style> block in the root
// layout. Everything is scoped under `.cal-app`, which holds the design tokens
// (colour, type, radius, shadow). Most static styling lives inline in the
// components (mirroring the prototype's inline `style="…"` source of truth);
// this file owns the tokens, the base reset/fonts, the app shell, and the
// classes that need pseudo-selectors, transitions or are reused a lot.

import type { CSSProperties } from "react";

// The phone-width column. Content scrolls; the footer (quick-add + bottom nav)
// is pinned via `.g-footer`, so leave room for it at the bottom.
export const wrap: CSSProperties = {
  maxWidth: 430,
  margin: "0 auto",
  minHeight: "100dvh",
  position: "relative",
};

export const CSS = `
.cal-app{
  /* ---- colour ---- */
  --paper:#F4F1E8; --sheet:#EFECE3; --surface:#FCFAF4;
  --ink:#1B1D17; --ink-soft:#41503A; --muted:#7A7E6F; --muted-2:#9A9C8F; --label:#8A8D7E;
  --hairline:#EBE7D9; --border:#E8E4D6; --border-sheet:#E4E0D2; --border-input:#E0DCCE;
  --sage:#55654C; --sage-deep:#43513B; --sage-tint:#E7EADF;
  --dot-empty:#DCE0D2;
  --terracotta:#BC6440; --terracotta-tint:#F1DFD5; --over-badge-bg:#F3E2D9;
  --ochre:#C2974A; --ochre-tint:#F0E6D2;
  /* ---- type ---- */
  --fg:var(--font-grotesk),'Space Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;
  --fm:var(--font-mono),'Space Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --fs:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  font-family:var(--fs); color:var(--ink); background:var(--paper);
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; line-height:1.45;
}
html,body{margin:0; padding:0; background:#F4F1E8;}
.cal-app *{box-sizing:border-box;}
.cal-app button{font-family:inherit; cursor:pointer;}
.cal-app input,.cal-app textarea{font-family:inherit;}
.cal-app a{color:inherit; text-decoration:none;}
.cal-app :focus-visible{outline:2px solid var(--sage); outline-offset:2px; border-radius:8px;}

/* ---- type helpers ---- */
.g-fg{font-family:var(--fg);}
.g-fm{font-family:var(--fm);}
.g-overline{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--label); font-weight:600;}

/* ---- app shell ---- */
.g-screen{display:flex; flex-direction:column; min-height:100dvh;}
.g-scroll{flex:1; min-height:0; padding-bottom:124px;}      /* clear the pinned footer */
.g-footer{position:fixed; left:50%; transform:translateX(-50%); bottom:0; width:100%; max-width:430px; z-index:30; pointer-events:none;}
.g-footer > *{pointer-events:auto;}

/* ---- bottom nav ---- */
.g-nav{display:flex; align-items:flex-end; justify-content:space-around; height:84px; padding:10px 20px 16px; background:var(--paper); border-top:1px solid #E3E0D2;}
.g-nav-item{display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; background:none; border:none; padding:0; color:#A0A294; transition:color .15s ease;}
.g-nav-item.is-active{color:var(--sage);}
.g-nav-item > span:last-child{font-size:10px; letter-spacing:.05em; font-weight:600;}
/* pill highlight behind the active tab's icon */
.g-nav-ico{display:grid; place-items:center; width:46px; height:30px; border-radius:999px; transition:background .18s ease;}
.g-nav-item.is-active .g-nav-ico{background:var(--sage-tint);}
.g-nav-plus{display:flex; flex-direction:column; align-items:center; flex:1;}
.g-nav-plus-btn{width:54px; height:54px; border-radius:50%; background:var(--sage); display:grid; place-items:center; border:none; margin-top:-26px; box-shadow:0 12px 22px -8px rgba(85,101,76,.6);}
.g-nav-plus-btn:hover{background:var(--sage-deep);}

/* ---- quick-add bar (Today) ---- */
.g-quick{display:flex; align-items:center; gap:10px; margin:0 16px 8px; background:var(--surface); border:1px solid var(--border-input); border-radius:16px; padding:9px 10px 9px 12px; box-shadow:0 10px 26px -14px rgba(20,22,18,.3);}
.g-quick-field{flex:1; min-width:0; display:flex; align-items:center; gap:10px; background:none; border:none; padding:0; text-align:left;}
.g-quick-ico{display:grid; place-items:center; background:none; border:none; padding:6px; border-radius:9px; color:var(--sage);}
.g-quick-ico:hover{background:var(--sage-tint);}

/* ---- dot grid ---- */
.g-grid{display:grid; grid-template-columns:repeat(12,1fr); gap:9px;}
.g-grid--mini{gap:3px; width:118px;}
.g-dot{width:100%; aspect-ratio:1; border-radius:50%;}

/* ---- buttons ---- */
.g-btn{display:flex; align-items:center; justify-content:center; gap:8px; width:100%; border-radius:14px; padding:16px; font-family:var(--fg); font-weight:600; font-size:15px; border:1px solid transparent; transition:background .15s ease, border-color .15s ease, opacity .15s ease;}
.g-btn-pri{background:var(--sage); color:var(--paper); box-shadow:0 12px 24px -10px rgba(85,101,76,.6);}
.g-btn-pri:hover:not(:disabled){background:var(--sage-deep);}
.g-btn-pri:disabled{opacity:.5; box-shadow:none; cursor:default;}
.g-btn-sec{background:var(--surface); color:var(--sage); border:1px solid var(--border-input);}
.g-btn-sec:hover{border-color:var(--sage); background:var(--sage-tint);}
.g-btn-ghost{background:none; color:var(--muted); border:none; font-size:13.5px; padding:12px; font-weight:600;}
.g-btn-ghost:hover:not(:disabled){color:var(--ink);}
.g-btn-block{border-radius:13px; padding:13px; font-size:14.5px;}

/* ---- inputs ---- */
.g-input{width:100%; background:var(--surface); border:1px solid var(--border-input); border-radius:14px; padding:14px; font-size:15px; color:var(--ink); line-height:1.45;}
.g-input:focus{outline:none; border-color:var(--sage);}
.g-input::placeholder{color:#9C9E90;}
textarea.g-input{resize:none; font-family:var(--fg);}
.g-eye{background:none; border:none; padding:4px; display:grid; place-items:center; color:#9C9E90;}
.g-eye:hover{color:var(--muted);}
/* Tappable editable number (Settings targets) — looks like a field, not text. */
.g-editnum{display:inline-flex; align-items:center; gap:5px; background:var(--paper); border:1px solid var(--border-input); border-radius:10px; padding:6px 9px 6px 11px; cursor:text; transition:border-color .15s ease, background .15s ease;}
.g-editnum:focus-within{border-color:var(--sage); background:var(--surface);}
.g-editnum input{border:none; background:none; outline:none; text-align:right; font-size:15px; color:var(--ink); width:52px; padding:0;}
.g-editnum input::placeholder{color:#B7B9AC;}
.g-editnum .g-editnum-pencil{flex:none; color:#B7B9AC;}
.g-editnum:focus-within .g-editnum-pencil{color:var(--sage);}

/* ---- sheets (Add a meal / Review estimate) ---- */
.g-sheet-bg{position:fixed; inset:0; background:rgba(24,26,20,.42); backdrop-filter:blur(2px); display:flex; align-items:flex-end; justify-content:center; z-index:50;}
.g-sheet{position:relative; background:var(--sheet); width:100%; max-width:430px; border-radius:28px 28px 0 0; max-height:92dvh; display:flex; flex-direction:column; overflow:hidden; animation:g-rise .26s cubic-bezier(.22,.61,.36,1);}
.g-sheet-loading{position:absolute; inset:0; z-index:5; background:rgba(239,236,227,.86); backdrop-filter:blur(1.5px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;}
@keyframes g-rise{from{transform:translateY(100%);} to{transform:translateY(0);}}
.g-sheet-grab{flex:none; display:flex; justify-content:center; padding-top:10px;}
.g-sheet-grab span{width:40px; height:5px; border-radius:3px; background:#CFCBBC;}
.g-sheet-head{flex:none; display:flex; align-items:center; justify-content:space-between; padding:14px 26px 4px;}
.g-sheet-title{font-family:var(--fg); font-weight:700; font-size:22px; color:var(--ink); letter-spacing:-.01em;}
.g-sheet-x{width:34px; height:34px; border-radius:50%; background:#E7E4D8; display:grid; place-items:center; border:none; color:#5C5F51;}
.g-sheet-x:hover{background:#DEDBCD;}
.g-sheet-body{flex:1; min-height:0; overflow:auto; padding:0 26px; -webkit-overflow-scrolling:touch;}

/* ---- editable calorie number (Review / manual entry) ---- */
.g-kcal-edit{display:block; font-family:var(--fg); font-weight:700; font-size:40px; color:var(--ink); letter-spacing:-.02em; line-height:1; border:none; border-bottom:1.5px dashed #CFCBBC; background:none; outline:none; padding:0 0 2px; min-width:2ch;}
.g-kcal-edit:focus{border-bottom-color:var(--sage);}
.g-kcal-edit::placeholder{color:#C7C3B5;}

/* ---- review steppers ---- */
.g-step{width:30px; height:30px; border-radius:50%; display:grid; place-items:center; font-size:18px; line-height:1; border:none; background:none;}
.g-step-minus{border:1px solid #D7D3C5; color:#7A7E6F;}
.g-step-minus:hover:not(:disabled){border-color:var(--muted);}
.g-step-minus:disabled{opacity:.4; cursor:default;}
.g-step-plus{background:#EBEDE4; color:var(--sage);}
.g-step-plus:hover{background:#E1E4D6;}

/* ---- segmented controls ---- */
.g-portion{font-family:var(--fm); font-size:13px; color:var(--muted); border:1px solid #D7D3C5; border-radius:9px; padding:6px 11px; background:none;}
.g-portion.is-on{color:var(--paper); background:var(--sage); border-color:var(--sage); padding:6px 13px;}
.g-segs{display:flex; gap:6px;}
.g-segs button{flex:1; padding:8px 4px; border:1px solid var(--border-input); background:var(--surface); border-radius:10px; font-family:var(--fg); font-weight:600; font-size:12.5px; color:var(--muted); transition:background .15s ease, color .15s ease, border-color .15s ease;}
.g-segs button.is-on{background:var(--sage); color:var(--paper); border-color:var(--sage);}
/* selectable option rows (target calculator) */
.g-opt{display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; text-align:left; background:var(--surface); border:1px solid var(--border-input); border-radius:13px; padding:12px 14px; transition:border-color .15s ease, background .15s ease;}
.g-opt.is-on{border-color:var(--sage); background:var(--sage-tint);}
.g-opt-dot{flex:none; width:18px; height:18px; border-radius:50%; border:2px solid #CFCBBC; box-sizing:border-box; transition:border-color .15s ease, background .15s ease;}
.g-opt-dot.on{border-color:var(--sage); background:var(--sage); box-shadow:inset 0 0 0 3px var(--sage-tint);}

.g-weekdays{display:flex; gap:6px;}
.g-weekday{flex:1; height:42px; border-radius:11px; border:1px solid var(--border-input); background:var(--surface); color:var(--muted); font-family:var(--fg); font-weight:600; font-size:13px; transition:background .15s ease, color .15s ease, border-color .15s ease;}
.g-weekday.on{background:var(--sage); border-color:var(--sage); color:var(--paper);}
.g-daytype{display:flex; background:#EDEADF; border-radius:10px; padding:3px;}
.g-daytype button{font-family:var(--fg); font-size:13px; font-weight:600; color:#7A7E6F; padding:6px 14px; border:none; background:none; border-radius:8px;}
.g-daytype button.is-on{color:var(--paper); background:var(--sage);}

/* ---- macro progress bar (Today macro cards) ---- */
.g-mbar{height:5px; border-radius:3px; background:#EAE7D9; overflow:hidden; margin-top:9px;}
.g-mbar > span{display:block; height:100%; border-radius:3px; transition:width .45s cubic-bezier(.22,.61,.36,1);}

/* ---- meal row + favourites + settings rows ---- */
.g-row-link{display:block; width:100%; background:none; border:none; text-align:left; padding:0;}
.g-fav{display:flex; align-items:center; gap:12px; background:var(--surface); border:1px solid var(--hairline); border-radius:14px; padding:10px 12px;}
.g-fav-add{width:30px; height:30px; flex:none; border-radius:50%; background:var(--sage); display:grid; place-items:center; border:none;}
.g-fav-add:hover{background:var(--sage-deep);}
/* Discreet but always reachable (the static mock has no delete; the app needs one). */
.g-meal-del{flex:none; border:none; background:none; color:#BFC1B4; padding:4px; margin-left:2px; display:grid; place-items:center; border-radius:8px; opacity:.5; transition:opacity .15s ease, color .15s ease;}
.g-meal:hover .g-meal-del{opacity:1;}
.g-meal-del:hover, .g-meal-del:focus-visible{opacity:1; color:var(--terracotta);}

/* ---- misc ---- */
.g-link{display:inline-flex; align-items:center; gap:7px; background:var(--surface); border:1px solid var(--border-input); border-radius:999px; padding:8px 14px; font-family:var(--fg); font-weight:600; font-size:13px; color:var(--ink-soft);}
.g-link:hover{border-color:var(--sage);}
.g-signout{display:block; width:100%; text-align:center; background:none; border:none; font-family:var(--fg); font-weight:600; font-size:14.5px; color:var(--terracotta); padding:8px;}
.g-spin{animation:g-rot 1s linear infinite;}
@keyframes g-rot{to{transform:rotate(360deg);}}
.g-err{margin-top:12px; font-size:13px; color:#9A4F30; background:#F6ECE6; border:1px solid #E6CFC4; padding:10px 12px; border-radius:12px;}

@media (prefers-reduced-motion: reduce){
  .g-mbar > span, .g-sheet, .g-nav-item{transition:none; animation:none;}
  .g-spin{animation:none;}
}

/* ---- barcode scanner (reused as-is from the existing camera flow) ---- */
.cal-icon{width:34px; height:34px; display:grid; place-items:center; border:1px solid var(--border); background:var(--surface); color:var(--ink-soft); border-radius:9px;}
.cal-err{margin-top:10px; font-size:13px; color:#9A4F30; background:#F6ECE6; border:1px solid #E6CFC4; padding:9px 11px; border-radius:9px;}
.cal-scan-bg{position:fixed; inset:0; background:rgba(24,26,20,.6); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px;}
.cal-scan{background:var(--paper); width:100%; max-width:420px; border-radius:16px; border:1px solid var(--border); overflow:hidden;}
.cal-scan-head{display:flex; align-items:center; justify-content:space-between; padding:14px 16px; font-weight:600; font-size:15px; border-bottom:1px solid var(--border);}
.cal-scan-video{position:relative; background:#000; aspect-ratio:4/3; display:flex; align-items:center; justify-content:center;}
.cal-scan-video video{width:100%; height:100%; object-fit:cover;}
.cal-scan-line{position:absolute; left:8%; right:8%; top:50%; height:2px; background:var(--terracotta); box-shadow:0 0 10px 1px var(--terracotta);}
.cal-scan-hint{padding:12px 16px; font-size:13px; color:var(--muted); text-align:center;}
.cal-spin{animation:g-rot 1s linear infinite;}
`;
