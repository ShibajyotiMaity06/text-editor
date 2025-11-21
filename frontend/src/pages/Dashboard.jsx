import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await axios.get('https://text-editor-backend-1-0d6p.onrender.com/api/documents');
            setDocuments(res.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const createDocument = async () => {
        try {
            const res = await axios.post('https://text-editor-backend-1-0d6p.onrender.com/api/documents', { title: 'Untitled Document' });
            navigate(`/editor/${res.data._id}`);
        } catch (error) {
            console.error('Error creating document:', error);
        }
    };

    const deleteDocument = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${id}`);
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>My Documents</h2>
                <button onClick={createDocument} className={styles.createBtn}>+ New Document</button>
            </div>
            <div className={styles.grid}>
                {documents.map((doc) => (
                    <div key={doc._id} className={styles.card} onClick={() => navigate(`/editor/${doc._id}`)}>
                        <h3>{doc.title}</h3>
                        <p>Owner: {doc.owner.username}</p>
                        <p>Last modified: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                        <button onClick={(e) => deleteDocument(doc._id, e)} className={styles.deleteBtn}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
