import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Chat from '../chat/Chat';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { chatOpen } = useChat();
  const { isStaff } = useAuth();
  
  return (
    <div className={`layout ${isStaff ? 'admin-layout' : ''}`}>
      <Header />
      <main className="main-content">
        {children}
      </main>
      {!isStaff && <Chat />}
      <Footer />
    </div>
  );
};

export default Layout; 