import MapComponent from './components/MapComponent';
import AdminForm from './components/AdminForm';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[380px_minmax(0,1fr)]">
        <AdminForm />
        <MapComponent />
      </div>
    </div>
  );
}
