import React, { useEffect, useState } from 'react';
import './ProductCommentsPage.css';

const API_BASE = 'http://localhost:5000/api';

export default function ProductCommentsPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState({}); // { [commentId]: reply }
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all products on mount
  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(res => res.json())
      .then(setProducts)
      .catch(() => setError('Failed to load products.'));
  }, []);

  // Fetch comments for selected product
  useEffect(() => {
    if (!selectedProduct) return;
    setLoading(true);
    fetch(`${API_BASE}/products/${selectedProduct.id}/comments`)
      .then(res => res.json())
      .then(data => {
        // Filter out system replies for each comment
        const processedData = data.map(comment => ({
          ...comment,
          replies: comment.replies.filter(reply => !reply.isSystem)
        }));
        setComments(processedData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load comments.');
        setLoading(false);
      });
  }, [selectedProduct]);

  // Handle reply submit
  const handleReply = async (commentId) => {
    setError('');
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) {
      setError('Reply cannot be empty.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products/${selectedProduct.id}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply, role: 'staff', username: 'support_staff' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post reply.');
      setReplyText({ ...replyText, [commentId]: '' });
      // Refresh comments
      fetch(`${API_BASE}/products/${selectedProduct.id}/comments`)
        .then(res => res.json())
        .then(data => {
          // Filter out system replies for each comment
          const processedData = data.map(comment => ({
            ...comment,
            replies: comment.replies.filter(reply => !reply.isSystem)
          }));
          setComments(processedData);
        })
        .catch(() => setError('Failed to refresh comments.'));
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="product-comments-page">
      <div className="page-header">
        <h2>Product Comments Management</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <div className="content-layout">
        {/* Products List Panel */}
        <div className="products-panel">
          <h3>Products</h3>
          <div className="products-list">
            {products.map(product => (
              <div 
                key={product.id} 
                className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="product-name">{product.name}</div>
                <div className="product-category">{product.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Panel */}
        <div className="comments-panel">
          {selectedProduct ? (
            <>
              <h3>Comments for {selectedProduct.name}</h3>
              {loading ? (
                <div className="loading">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="no-comments">No comments for this product yet.</div>
              ) : (
                <div className="comments-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-header">
                        <span className="username">{comment.username}</span>
                        <span className="timestamp">{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="comment-content">{comment.comment}</div>
                      
                      {comment.replies && comment.replies.length > 0 ? (
                        <div className="replies-list">
                          <h4>Staff Reply:</h4>
                          {comment.replies.map(r => (
                            <div key={r.id} className="reply staff">
                              <div className="reply-content">{r.reply}</div>
                              <div className="reply-timestamp">{new Date(r.timestamp).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="reply-form">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText[comment.id] || ''}
                            onChange={e => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                          />
                          <button onClick={() => handleReply(comment.id)}>Reply</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              Select a product to view its comments
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 