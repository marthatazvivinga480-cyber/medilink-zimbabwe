export default function ContextualError({ message }: { message: string }) {
 return <div role="alert" className="my-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{message}</p><p className="mt-2">Check your connection. If you submitted a request, check its status before submitting again.</p><button type="button" className="btn-secondary mt-3" onClick={() => window.location.reload()}>Reload information</button></div>;
}
