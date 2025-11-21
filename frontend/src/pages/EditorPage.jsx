import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '../components/Editor';

const EditorPage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                });

                if (res.data.role === 'owner') {
                    setIsOwner(true);
                    setPendingRequests(res.data.pendingRequests || []);
                }
                setLoading(false);
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    setAccessDenied(true);
                    setHasPendingRequest(error.response.data.hasPendingRequest);
                }
                setLoading(false);
            }
        };
        checkAccess();
    }, [id, refreshTrigger]);

    const handleRequestAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${id}/request-access`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setHasPendingRequest(true);
            alert('Access requested!');
        } catch (error) {
            console.error('Error requesting access:', error);
        }
    };

    const handleGrantAccess = async (userId, role) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${id}/grant-access`, { userId, role }, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            alert('Access granted!');
            setRefreshTrigger(prev => prev + 1); // Refresh to update list
        } catch (error) {
            console.error('Error granting access:', error);
        }
    };

    if (loading) return <div>Loading document...</div>;

    if (accessDenied) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this document.</p>
                {hasPendingRequest ? (
                    <button disabled style={{ padding: '10px 20px', cursor: 'not-allowed' }}>
                        Access Requested (Pending Approval)
                    </button>
                ) : (
                    <button onClick={handleRequestAccess} style={{ padding: '10px 20px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Request Access
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            {isOwner && pendingRequests.length > 0 && (
                <div style={{ background: '#fff3cd', padding: '10px', margin: '10px', border: '1px solid #ffeeba', borderRadius: '4px' }}>
                    <h3>Pending Access Requests</h3>
                    <ul>
                        {pendingRequests.map(req => (
                            <li key={req} style={{ marginBottom: '5px' }}>
                                User ID: {req}
                                <button onClick={() => handleGrantAccess(req, 'editor')} style={{ marginLeft: '10px', marginRight: '5px' }}>Grant Editor</button>
                                <button onClick={() => handleGrantAccess(req, 'viewer')}>Grant Viewer</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Editor documentId={id} />
        </div>
    );
};

export default EditorPage;
