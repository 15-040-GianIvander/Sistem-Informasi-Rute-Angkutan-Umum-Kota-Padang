import MapComponent from './components/MapComponent';
import AdminForm from './components/AdminForm';

export default function App() {
  const path = window.location.pathname;
  
  if (path === '/admin') {
    return <AdminForm />;
  }

  return <MapComponent />;
}
