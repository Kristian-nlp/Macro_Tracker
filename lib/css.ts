// Scoped CSS from the original artifact, injected once as a <style> block in the
// root layout. Everything is scoped under .cal-app (which defines the CSS
// variables). Additions for the dedicated History page and the login gate are
// at the end, in the same visual language.

export const wrap: React.CSSProperties = {
  maxWidth: 480,
  margin: "0 auto",
  padding: "18px 14px 28px",
};

export const CSS = `
.cal-app{
  --paper:#EDEFE9; --surface:#FAFBF7; --surface-2:#F1F3ED;
  --ink:#1B1D18; --ink-soft:#41443B; --muted:#6B6F62;
  --line:#DCDFD4; --line-strong:#C7CBBC;
  --accent:#55654C; --accent-deep:#43513C; --accent-soft:#E6EBDF;
  --over:#A8654A;
  --fs: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --fm: ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  font-family:var(--fs); color:var(--ink); background:var(--paper);
  -webkit-font-smoothing:antialiased; line-height:1.45;
}
html,body{margin:0; padding:0; background:#EDEFE9;}
.cal-app *{box-sizing:border-box;}
.cal-app button{font-family:var(--fs); cursor:pointer;}
.cal-app a{color:inherit; text-decoration:none;}
.cal-app :focus-visible{outline:2px solid var(--accent); outline-offset:2px; border-radius:6px;}

.cal-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;}
.cal-brand{display:flex; align-items:center; gap:9px; font-weight:600; font-size:15px; letter-spacing:-0.01em;}
.cal-mark{width:13px; height:13px; border-radius:3px; background:var(--accent); display:inline-block;}
.cal-icon{width:34px; height:34px; display:grid; place-items:center; border:1px solid var(--line); background:var(--surface); color:var(--ink-soft); border-radius:9px;}
.cal-icon:hover{border-color:var(--line-strong);}

.cal-card{background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:18px; margin-bottom:12px;}
.cal-eyebrow{font-size:10.5px; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); font-weight:600;}

.cal-hero{display:flex; gap:18px; align-items:stretch;}
.cal-vessel{flex:0 0 auto;}
.cal-fill{transition:height .55s cubic-bezier(.22,.61,.36,1), y .55s cubic-bezier(.22,.61,.36,1);}
.cal-hero-r{flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-start;}
.cal-big{font-family:var(--fm); font-size:50px; line-height:1; font-weight:500; letter-spacing:-0.03em; margin-top:6px;}
.cal-big.cal-over{color:var(--over);}
.cal-big-sub{font-size:13px; color:var(--muted); margin-top:4px;}
.cal-meter{font-family:var(--fm); font-size:13px; margin-top:10px; color:var(--ink-soft);}
.cal-dim{color:var(--muted);}
.cal-macros{display:flex; gap:13px;}
.cal-hero-top{display:flex; align-items:center; justify-content:space-between; gap:8px; row-gap:8px; margin-bottom:2px; flex-wrap:wrap;}
.cal-hero-bottom{display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:auto; padding-top:16px; flex-wrap:wrap;}
.cal-switch{position:relative; flex:0 0 auto; width:148px; height:30px; border-radius:999px; border:1px solid var(--line-strong); background:var(--surface-2); padding:3px; display:flex;}
.cal-switch-opt{position:relative; z-index:1; flex:1; display:grid; place-items:center; font-size:11px; font-weight:600; letter-spacing:0.02em; color:var(--muted); transition:color .2s ease;}
.cal-switch-knob{position:absolute; z-index:0; top:3px; left:3px; width:calc(50% - 3px); height:calc(100% - 6px); border-radius:999px; background:var(--accent); transition:transform .22s cubic-bezier(.22,.61,.36,1);}
.cal-switch.is-training .cal-switch-knob{transform:translateX(100%);}
.cal-switch.is-rest .cal-switch-opt.rest{color:#F7F8F3;}
.cal-switch.is-training .cal-switch-opt.training{color:#F7F8F3;}
.cal-macro-v{font-family:var(--fm); font-size:17px; font-weight:500; letter-spacing:-0.02em;}
.cal-macro-u{font-size:11px; color:var(--muted); margin-left:1px;}
.cal-macro-l{font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-top:2px;}

.cal-chips{display:flex; flex-wrap:wrap; gap:7px; margin-bottom:12px;}
.cal-chip{display:inline-flex; align-items:center; gap:5px; font-size:13px; padding:7px 11px; border-radius:999px; border:1px solid var(--line-strong); background:var(--surface); color:var(--ink-soft);}
.cal-chip:hover{background:var(--accent-soft); border-color:var(--accent);}
.cal-chip-k{font-family:var(--fm); font-size:12px; color:var(--muted);}

.cal-input{width:100%; border:1px solid var(--line-strong); background:var(--surface-2); border-radius:10px; padding:11px 12px; font-size:15px; color:var(--ink); font-family:var(--fs);}
.cal-input::placeholder{color:#9a9d90;}
.cal-input:focus{outline:none; border-color:var(--accent); background:var(--surface);}
.cal-area{resize:vertical; line-height:1.4;}

.cal-thumb{position:relative; width:96px; height:96px; margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid var(--line-strong);}
.cal-thumb img{width:100%; height:100%; object-fit:cover; display:block;}
.cal-thumb-x{position:absolute; top:4px; right:4px; width:24px; height:24px; border-radius:7px; border:none; background:rgba(20,22,18,.72); color:#fff; display:grid; place-items:center;}

.cal-row{display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;}
.cal-btn{display:inline-flex; align-items:center; justify-content:center; gap:7px; font-size:14px; font-weight:500; padding:10px 14px; border-radius:10px; border:1px solid transparent; white-space:nowrap;}
.cal-btn:disabled{opacity:.45; cursor:default;}
.cal-btn-pri{background:var(--accent); color:#F7F8F3; border-color:var(--accent);}
.cal-btn-pri:hover:not(:disabled){background:var(--accent-deep);}
.cal-btn-sec{background:var(--surface); color:var(--ink); border-color:var(--line-strong);}
.cal-btn-sec:hover:not(:disabled){border-color:var(--accent); color:var(--accent-deep);}
.cal-btn-ghost{background:transparent; color:var(--ink-soft); border-color:transparent; padding:10px 8px;}
.cal-btn-ghost:hover:not(:disabled){color:var(--accent-deep);}

.cal-err{margin-top:10px; font-size:13px; color:var(--over); background:#F6ECE6; border:1px solid #E6CFC4; padding:9px 11px; border-radius:9px;}

.cal-entry{margin-top:14px; padding-top:14px; border-top:1px solid var(--line);}
.cal-entry .cal-input{margin-bottom:9px;}
.cal-fields{display:grid; grid-template-columns:repeat(4,1fr); gap:8px;}
.cal-field{display:flex; flex-direction:column; gap:3px;}
.cal-field input{width:100%; border:1px solid var(--line-strong); background:var(--surface-2); border-radius:9px; padding:9px 8px; font-family:var(--fm); font-size:15px; text-align:center; color:var(--ink);}
.cal-field input:focus{outline:none; border-color:var(--accent); background:var(--surface);}
.cal-field.acc input{border-color:var(--accent); background:var(--accent-soft); font-weight:600;}
.cal-field span{font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); text-align:center;}
.cal-note{margin-top:9px; font-size:12.5px; color:var(--muted); font-style:italic;}

.cal-empty{font-size:14px; color:var(--muted); padding:8px 0;}
.cal-list{list-style:none; margin:0; padding:0;}
.cal-li{display:flex; align-items:center; gap:11px; padding:11px 0; border-bottom:1px solid var(--line);}
.cal-li:last-child{border-bottom:none;}
.cal-li-time{font-family:var(--fm); font-size:12px; color:var(--muted); width:38px; flex:0 0 auto;}
.cal-li-main{flex:1; min-width:0;}
.cal-li-name{font-size:14.5px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.cal-li-meta{font-family:var(--fm); font-size:11px; color:var(--muted); margin-top:2px;}
.cal-li-k{font-family:var(--fm); font-size:15px; font-weight:600; color:var(--ink); letter-spacing:-0.02em;}
.cal-li-del{border:none; background:none; color:#b3b6a9; padding:4px; display:grid; place-items:center;}
.cal-li-del:hover{color:var(--over);}

.cal-foot{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:4px; padding:0 4px;}
.cal-foot-note{font-size:11px; color:var(--muted); text-align:right; max-width:60%;}

.cal-modal-bg{position:fixed; inset:0; background:rgba(24,26,20,.42); backdrop-filter:blur(2px); display:flex; align-items:flex-end; justify-content:center; z-index:50; padding:0;}
.cal-modal{background:var(--paper); width:100%; max-width:480px; border-radius:18px 18px 0 0; max-height:88vh; overflow:auto; border:1px solid var(--line); border-bottom:none;}
.cal-modal-head{position:sticky; top:0; background:var(--paper); display:flex; align-items:center; justify-content:space-between; padding:16px 16px 12px; font-weight:600; font-size:16px; border-bottom:1px solid var(--line);}
.cal-modal-body{padding:16px;}

.cal-srow{display:flex; align-items:center; justify-content:space-between; gap:12px; padding:7px 0;}
.cal-srow label{font-size:14px; color:var(--ink-soft);}
.cal-sinput{width:140px; border:1px solid var(--line-strong); background:var(--surface); border-radius:9px; padding:9px 11px; font-family:var(--fm); font-size:15px; text-align:right; color:var(--ink);}
.cal-sinput:focus{outline:none; border-color:var(--accent);}
.cal-sinput::placeholder{font-family:var(--fs); font-size:12px; color:#a0a395;}

.cal-weekdays{display:flex; gap:6px;}
.cal-wd{flex:1; height:40px; border-radius:9px; border:1px solid var(--line-strong); background:var(--surface); color:var(--muted); font-size:13px; font-weight:600;}
.cal-wd.on{background:var(--accent); border-color:var(--accent); color:#F7F8F3;}

.cal-seg{display:flex; gap:6px;}
.cal-segb{flex:1; padding:9px; border-radius:9px; border:1px solid var(--line-strong); background:var(--surface); color:var(--muted); font-size:13px; text-transform:capitalize;}
.cal-segb.on{background:var(--accent-soft); border-color:var(--accent); color:var(--accent-deep); font-weight:600;}

.cal-hlist{list-style:none; margin:0; padding:0;}
.cal-hrow{padding:11px 0; border-bottom:1px solid var(--line);}
.cal-hrow:last-child{border-bottom:none;}
.cal-hrow-top{display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px;}
.cal-hdate{font-size:14px; color:var(--ink);}
.cal-hk{font-family:var(--fm); font-size:13px; color:var(--muted);}
.cal-hbar{height:6px; border-radius:99px; background:var(--surface-2); overflow:hidden;}
.cal-hbar span{display:block; height:100%; border-radius:99px; transition:width .4s ease;}

.cal-scanned{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:9px; padding:10px 12px; border:1px solid var(--accent); background:var(--accent-soft); border-radius:10px;}
.cal-scanned-name{font-size:13.5px; color:var(--ink); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.cal-scanned-amt{display:flex; align-items:center; gap:6px; flex:0 0 auto;}
.cal-scanned-amt input{width:64px; border:1px solid var(--line-strong); background:var(--surface); border-radius:8px; padding:7px 8px; font-family:var(--fm); font-size:14px; text-align:right; color:var(--ink);}
.cal-scanned-amt input:focus{outline:none; border-color:var(--accent);}
.cal-scanned-amt span{font-size:12px; color:var(--muted);}

.cal-scan-bg{position:fixed; inset:0; background:rgba(24,26,20,.6); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px;}
.cal-scan{background:var(--paper); width:100%; max-width:420px; border-radius:16px; border:1px solid var(--line); overflow:hidden;}
.cal-scan-head{display:flex; align-items:center; justify-content:space-between; padding:14px 16px; font-weight:600; font-size:15px; border-bottom:1px solid var(--line);}
.cal-scan-video{position:relative; background:#000; aspect-ratio:4/3; display:flex; align-items:center; justify-content:center;}
.cal-scan-video video{width:100%; height:100%; object-fit:cover;}
.cal-scan-line{position:absolute; left:8%; right:8%; top:50%; height:2px; background:var(--over); box-shadow:0 0 10px 1px var(--over);}
.cal-scan-hint{padding:12px 16px; font-size:13px; color:var(--muted); text-align:center;}

.cal-spin{animation:cal-rot 1s linear infinite;}
@keyframes cal-rot{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){
  .cal-fill,.cal-hbar span{transition:none;} .cal-spin{animation:none;}
}

/* ---------------------------- additions: history --------------------------- */
.cal-link{display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-soft);}
.cal-link:hover{color:var(--accent-deep);}
.cal-range{display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap;}
.cal-range .cal-rfield{display:flex; flex-direction:column; gap:4px; flex:1; min-width:120px;}
.cal-range label{font-size:10.5px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); font-weight:600;}
.cal-date{width:100%; border:1px solid var(--line-strong); background:var(--surface-2); border-radius:10px; padding:9px 11px; font-family:var(--fm); font-size:14px; color:var(--ink);}
.cal-date:focus{outline:none; border-color:var(--accent); background:var(--surface);}
.cal-presets{display:flex; gap:6px; flex-wrap:wrap; margin-top:10px;}
.cal-preset{font-size:12px; padding:6px 10px; border-radius:999px; border:1px solid var(--line-strong); background:var(--surface); color:var(--ink-soft);}
.cal-preset.on{background:var(--accent-soft); border-color:var(--accent); color:var(--accent-deep); font-weight:600;}
.cal-avg{display:flex; gap:14px;}
.cal-avg-cell{flex:1;}
.cal-avg-v{font-family:var(--fm); font-size:24px; font-weight:500; letter-spacing:-0.02em;}
.cal-avg-u{font-size:12px; color:var(--muted); margin-left:2px;}
.cal-avg-l{font-size:10.5px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-top:3px;}
.cal-hmeta{font-family:var(--fm); font-size:11px; color:var(--muted); margin-top:5px;}
.cal-hbadge{font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted);}

/* ---------------------------- additions: login ----------------------------- */
.cal-login{min-height:70vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; text-align:center;}
.cal-login .cal-card{width:100%; max-width:340px; text-align:left;}
.cal-login h1{font-size:18px; font-weight:600; margin:0 0 4px;}
.cal-login p{font-size:13px; color:var(--muted); margin:0 0 14px;}
.cal-user{font-family:var(--fm); font-size:15px; color:var(--ink);}
`;
