const metrics = [
  { value: "$0", label: "Payouts available" },
  { value: "1", label: "Known fixture vulnerability" },
  { value: "1", label: "Runnable local program" },
  { value: "2", label: "Reviewed fixture variants" },
] as const;

export function DemoMetrics() {
  return <div className="demo-metrics" aria-label="Local demo figures">
    <dl>{metrics.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
  </div>;
}
