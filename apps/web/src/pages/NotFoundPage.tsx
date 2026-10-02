import { Link } from 'react-router';
import { ROUTES } from '@/routes/paths';

export const NotFoundPage = () => (
  <main className="page">
    <h1>Page not found</h1>
    <Link to={ROUTES.HOME}>Go to home</Link>
  </main>
);
