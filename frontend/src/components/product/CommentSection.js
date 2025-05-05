import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faReply, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { productApi } from '../../services/api';
import './CommentSection.css';

const CommentSection = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch comments when component mounts or productId changes
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await productApi.getProductComments(productId);
        setComments(data);
        setError(null);
      } catch (err) {
        setError('Failed to load comments. Please try again later.');
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [productId]);
  
  // Handle submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment || !username) return;
    
    try {
      const result = await productApi.addComment(productId, username, newComment);
      
      // Refetch comments to get the new comment with system reply
      const updatedComments = await productApi.getProductComments(productId);
      setComments(updatedComments);
      
      // Reset form
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment. Please try again.');
    }
  };
  
  return (
    <div className="comment-section">
      <h2 className="section-title">
        <FontAwesomeIcon icon={faCommentDots} />
        Customer Comments
      </h2>
      
      {/* Comment form */}
      <form className="comment-form" onSubmit={handleSubmitComment}>
        <div className="form-group">
          <label htmlFor="username">Your Name</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="comment">Your Comment</label>
          <textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            rows="4"
            required
          ></textarea>
        </div>
        
        <button type="submit" className="submit-comment-btn">
          Post Comment
        </button>
      </form>
      
      {/* Comments list */}
      <div className="comments-list">
        {loading ? (
          <div className="loading">Loading comments...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-user">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{comment.username}</span>
                </div>
                <div className="comment-date">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="comment-content">{comment.comment}</div>
              
              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="replies-container">
                  {comment.replies.map((reply) => (
                    <div 
                      key={reply.id} 
                      className={`reply-item ${reply.isSystem ? 'system-reply' : 'user-reply'}`}
                    >
                      <div className="reply-header">
                        <div className="reply-user">
                          <FontAwesomeIcon icon={faReply} />
                          <span>{reply.isSystem ? 'System' : 'Staff'}</span>
                        </div>
                        <div className="reply-date">
                          {new Date(reply.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="reply-content">{reply.reply}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection; 