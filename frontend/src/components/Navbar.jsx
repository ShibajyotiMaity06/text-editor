import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link to="/">Collaborative Editor</Link>
            </div>
            <div className={styles.links}>
                {user ? (
                    <>
                        <span className={styles.username}>Welcome, {user.username}</span>
                        <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
