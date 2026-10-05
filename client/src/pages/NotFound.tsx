import { Link } from "react-router-dom";
export default function NotFound(){return <div className="grid min-h-[65vh] place-items-center px-5 text-center"><div><p className="text-teal font-semibold">404</p><h1 className="mt-2 font-display text-4xl font-bold text-navy">Page not found</h1><Link className="btn-primary mt-6" to="/">Return home</Link></div></div>}
