<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<div style="display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid #E4E1D3;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="width:42px;height:42px;flex:none;border-radius:13px;background:{{ tint }};display:grid;place-items:center;" title="{{ domLabel }}">
    <sc-if value="{{ isCircle }}" hint-placeholder-val="{{ true }}"><div style="width:16px;height:16px;border-radius:50%;background:{{ accent }};"></div></sc-if>
    <sc-if value="{{ isSquare }}" hint-placeholder-val="{{ false }}"><div style="width:15px;height:15px;border-radius:4px;background:{{ accent }};"></div></sc-if>
    <sc-if value="{{ isTriangle }}" hint-placeholder-val="{{ false }}"><div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:15px solid {{ accent }};"></div></sc-if>
  </div>
  <div style="flex:1;min-width:0;">
    <div style="font-family:'Space Grotesk',system-ui,sans-serif;font-weight:500;font-size:15px;color:#1B1D17;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ title }}</div>
    <div style="font-size:12px;color:#7A7E6F;margin-top:2px;">{{ meta }}</div>
  </div>
  <div style="flex:none;display:flex;flex-direction:column;align-items:flex-end;">
    <div style="display:flex;align-items:baseline;gap:3px;"><span style="font-family:'Space Mono',ui-monospace,monospace;font-size:15px;color:#1B1D17;">{{ kcal }}</span><span style="font-size:10px;color:#A2A496;">kcal</span></div>
    <div style="font-family:'Space Mono',ui-monospace,monospace;font-size:10.5px;margin-top:3px;letter-spacing:.01em;"><span style="color:{{ pCol }};font-weight:{{ pWeight }};">P{{ protein }}</span><span style="color:#C9CBBE;"> · </span><span style="color:{{ cCol }};font-weight:{{ cWeight }};">C{{ carbs }}</span><span style="color:#C9CBBE;"> · </span><span style="color:{{ fCol }};font-weight:{{ fWeight }};">F{{ fat }}</span></div>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;$preview&quot;:{&quot;width&quot;:342,&quot;height&quot;:66},&quot;title&quot;:{&quot;editor&quot;:&quot;text&quot;,&quot;default&quot;:&quot;Chicken &amp; rice bowl&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;meta&quot;:{&quot;editor&quot;:&quot;text&quot;,&quot;default&quot;:&quot;Lunch · 12:40&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;kcal&quot;:{&quot;editor&quot;:&quot;text&quot;,&quot;default&quot;:&quot;660&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;protein&quot;:{&quot;editor&quot;:&quot;int&quot;,&quot;default&quot;:54,&quot;min&quot;:0,&quot;max&quot;:150,&quot;tsType&quot;:&quot;number&quot;},&quot;carbs&quot;:{&quot;editor&quot;:&quot;int&quot;,&quot;default&quot;:76,&quot;min&quot;:0,&quot;max&quot;:250,&quot;tsType&quot;:&quot;number&quot;},&quot;fat&quot;:{&quot;editor&quot;:&quot;int&quot;,&quot;default&quot;:16,&quot;min&quot;:0,&quot;max&quot;:150,&quot;tsType&quot;:&quot;number&quot;}}">
class Component extends DCLogic {
  renderVals() {
    const p = parseFloat(this.props.protein) || 0;
    const c = parseFloat(this.props.carbs) || 0;
    const f = parseFloat(this.props.fat) || 0;

    // dominant macro by calorie contribution (P/C = 4 kcal/g, F = 9 kcal/g)
    const cal = { protein: p * 4, carbs: c * 4, fat: f * 9 };
    let dom = 'protein', best = cal.protein;
    if (cal.carbs > best) { dom = 'carbs'; best = cal.carbs; }
    if (cal.fat > best) { dom = 'fat'; best = cal.fat; }

    const map = {
      protein: { accent: '#55654C', tint: '#E7EADF', label: 'Mostly protein' },
      carbs:   { accent: '#BC6440', tint: '#F1DFD5', label: 'Mostly carbs' },
      fat:     { accent: '#C2974A', tint: '#F0E6D2', label: 'Mostly fat' },
    };
    const m = map[dom];
    const muted = '#A6A89A';

    return {
      isCircle: dom === 'protein',
      isSquare: dom === 'carbs',
      isTriangle: dom === 'fat',
      accent: m.accent,
      tint: m.tint,
      domLabel: m.label,
      pCol: dom === 'protein' ? '#55654C' : muted,
      cCol: dom === 'carbs' ? '#BC6440' : muted,
      fCol: dom === 'fat' ? '#C2974A' : muted,
      pWeight: dom === 'protein' ? '700' : '400',
      cWeight: dom === 'carbs' ? '700' : '400',
      fWeight: dom === 'fat' ? '700' : '400',
    };
  }
}
</script>
</body>
</html>
