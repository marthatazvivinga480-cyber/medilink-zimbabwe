export default function ListSearch({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
 return <div className="my-4 flex flex-wrap items-center gap-3"><label className="min-w-0 flex-1"><span className="sr-only">{label}</span><input type="search" className="field" placeholder={label} value={value} onChange={e => onChange(e.target.value)} /></label>{value && <button type="button" className="btn-secondary" onClick={() => onChange("")}>Clear search</button>}</div>;
}
