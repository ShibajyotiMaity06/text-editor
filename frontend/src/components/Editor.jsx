import { useEffect, useState, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import { io } from 'socket.io-client';

Quill.register('modules/cursors', QuillCursors);
import axios from 'axios';
import styles from './Editor.module.css';

const Editor = ({ documentId }) => {
    const [socket, setSocket] = useState(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const quillRef = useRef(null);
    const lastSelectionRef = useRef(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [saveStatus, setSaveStatus] = useState('');
    const [userRole, setUserRole] = useState('editor');


    const contentRef = useRef(content);
    const titleRef = useRef(title);

    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    useEffect(() => {
        titleRef.current = title;
    }, [title]);

    useEffect(() => {
        const s = io('https://text-editor-backend-1-0d6p.onrender.com');
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, []);

    const [typingUsers, setTypingUsers] = useState(new Set());
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!socket || !documentId) return;


        const storedUser = JSON.parse(localStorage.getItem('user'));
        const username = storedUser?.username || 'Guest ' + Math.floor(Math.random() * 1000);
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

        socket.emit('join-document', { documentId, user: { username }, color });

        const fetchDocument = async () => {
            try {
                const res = await axios.get(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${documentId}`, { withCredentials: true });
                setTitle(res.data.title);
                setContent(res.data.content);
                setUserRole(res.data.role || 'editor');
            } catch (error) {
                console.error('Error loading document:', error);
            }
        };
        fetchDocument();

        socket.on('receive-changes', (delta) => {
            if (quillRef.current) {
                quillRef.current.getEditor().updateContents(delta);
            }
        });

        socket.on('active-users', (users) => {
            setActiveUsers(users);
        });

        socket.on('cursor-update', (data) => {
            const cursorsModule = quillRef.current.getEditor().getModule('cursors');
            if (cursorsModule) {
                cursorsModule.createCursor(data.socketId, data.user, data.color);
                cursorsModule.moveCursor(data.socketId, data.range);
            }
        });

        socket.on('user-typing', ({ user, isTyping }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (isTyping) newSet.add(user);
                else newSet.delete(user);
                return newSet;
            });
        });

        return () => {
            socket.off('receive-changes');
            socket.off('active-users');
            socket.off('cursor-update');
            socket.off('user-typing');
        };
    }, [socket, documentId]);

    const handleChange = (content, delta, source, editor) => {
        setContent(content);

        if (source === 'user') {
            socket.emit('send-changes', { delta, documentId });


            socket.emit('typing', { documentId, isTyping: true });


            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);


            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing', { documentId, isTyping: false });


            }, 2000);
        }
    };

    const handleSelectionChange = (range, source, editor) => {
        if (range) {
            console.log('Selection changed:', range);
            lastSelectionRef.current = range;
        } else {
            console.log('Selection lost (null)');
        }
        if (source !== 'user' || !socket || !range) return;
        socket.emit('cursor-move', { range, documentId, user: 'User' });
    };

    const saveDocument = async (silent = false) => {
        if (silent) setSaveStatus('Saving...');
        try {
            await axios.put(`https://text-editor-backend-1-0d6p.onrender.com/api/documents/${documentId}`, {
                title: titleRef.current,
                content: contentRef.current
            }, { withCredentials: true });
            if (!silent) alert('Saved!');
            setSaveStatus('Saved');
            setTimeout(() => setSaveStatus(''), 3000);
            console.log('Document saved');
        } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('Error saving');
        }
    };

    const requestAi = async (type = 'generate') => {
        setLoadingAi(true);
        try {
            const token = localStorage.getItem('token');
            const editor = quillRef.current.getEditor();
            const selection = editor.getSelection();

            let context = '';
            if (type === 'grammar' || type === 'summarize') {

                context = selection && selection.length > 0
                    ? editor.getText(selection.index, selection.length)
                    : editor.getText();
            } else if (type === 'autocomplete') {

                const text = editor.getText();
                context = text.slice(Math.max(0, text.length - 1000));
            } else {

                context = editor.getText();
            }

            const res = await axios.post('https://text-editor-backend-1-0d6p.onrender.com/api/ai/generate', {
                prompt: aiPrompt,
                context: context,
                type: type
            }, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setAiSuggestion(res.data.suggestion);
        } catch (error) {
            console.error('AI Error:', error);
            setAiSuggestion('Error generating suggestion.');
        }
        setLoadingAi(false);
    };

    const applySuggestion = () => {
        const editor = quillRef.current.getEditor();
        const range = lastSelectionRef.current || editor.getSelection();
        console.log('Applying suggestion. Range:', range, 'Stored:', lastSelectionRef.current, 'Current:', editor.getSelection());

        if (range) {
            editor.insertText(range.index, aiSuggestion);

            editor.setSelection(range.index + aiSuggestion.length);
        } else {
            const length = editor.getLength();
            editor.insertText(length, aiSuggestion);
            editor.setSelection(length + aiSuggestion.length);
        }
        setAiSuggestion('');
        setAiPrompt('');
    };
    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.userList}>
                    {activeUsers.map((u, i) => (
                        <span
                            key={i}
                            className={styles.userBadge}
                            title={u.username}
                            style={{ backgroundColor: u.color, color: '#fff', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginRight: '5px', fontSize: '12px' }}
                        >
                            {u.username.charAt(0).toUpperCase()}
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.titleInput}
                    readOnly={userRole === 'viewer'}
                />
                {userRole !== 'viewer' && (
                    <button onClick={() => saveDocument(false)} className={styles.saveBtn}>Save</button>
                )}
                {saveStatus && <span style={{ marginLeft: '10px', color: '#666' }}>{saveStatus}</span>}
            </div>

            <div className={styles.editorWrapper}>
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={handleChange}
                    onChangeSelection={handleSelectionChange}
                    ref={quillRef}
                    className={styles.quill}
                    readOnly={userRole === 'viewer'}
                    modules={{
                        cursors: true,
                        toolbar: userRole !== 'viewer' ? [
                            [{ header: [1, 2, false] }],
                            ['bold', 'italic', 'underline'],
                            ['image', 'code-block']
                        ] : false
                    }}
                />
            </div>

            {userRole !== 'viewer' && (
                <div className={styles.aiPanel}>
                    <h3>AI Assistant</h3>
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask AI to write something..."
                        className={styles.aiInput}
                    />
                    <div className={styles.aiControls}>
                        <button onClick={() => requestAi('generate')} disabled={loadingAi} className={styles.aiBtn}>
                            {loadingAi ? 'Thinking...' : 'Generate'}
                        </button>
                        <div className={styles.secondaryControls}>
                            <button onClick={() => requestAi('grammar')} disabled={loadingAi} className={styles.aiBtnSecondary} title="Fix grammar in selection">
                                ✨ Grammar
                            </button>
                            <button onClick={() => requestAi('autocomplete')} disabled={loadingAi} className={styles.aiBtnSecondary} title="Continue writing">
                                🖊️ Continue
                            </button>
                            <button onClick={() => requestAi('review')} disabled={loadingAi} className={styles.aiBtnSecondary} title="Get writing advice">
                                🧐 Review
                            </button>
                            <button onClick={() => requestAi('summarize')} disabled={loadingAi} className={styles.aiBtnSecondary} title="Summarize text">
                                📝 Summarize
                            </button>
                        </div>
                    </div>
                    {typingUsers.size > 0 && (
                        <div className={styles.typingIndicator}>
                            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                        </div>
                    )}
                    {aiSuggestion && (
                        <div className={styles.suggestionBox}>
                            <p>{aiSuggestion}</p>
                            <button onClick={applySuggestion} className={styles.applyBtn}>Insert</button>
                            <button onClick={() => setAiSuggestion('')} className={styles.dismissBtn}>Dismiss</button>
                        </div>
                    )}
                </div>
            )}
        </div >
    );
};

export default Editor;
