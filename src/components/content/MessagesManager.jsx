import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  MailOpen,
  Reply,
  Trash2,
  Clock,
  User,
  Phone,
  Calendar,
  X,
  Send
} from 'lucide-react';

// --- Mocking External Dependencies for Self-Containment ---
// In a real project, you would import these from your component library
const components = {
  Button: ({ className, variant, children, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        variant === 'outline'
          ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
      } ${className}`}
    >
      {children}
    </button>
  ),
  Input: ({ className, placeholder, value, onChange }) => (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${className}`}
    />
  ),
  Label: ({ htmlFor, className, children }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-200 ${className}`}>
      {children}
    </label>
  ),
  Textarea: ({ className, placeholder, value, onChange, rows }) => (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${className}`}
    ></textarea>
  ),
  Card: ({ className, children }) => (
    <div className={`rounded-lg shadow-sm border dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  ),
  CardHeader: ({ className, children }) => (
    <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  ),
  CardTitle: ({ className, children }) => (
    <h2 className={`text-xl font-bold dark:text-white ${className}`}>
      {children}
    </h2>
  ),
  CardContent: ({ className, children }) => (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  ),
  Badge: ({ className, children }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
};

const { Button, Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, Badge } = components;

// --- Mocking Hooks and Data ---
const useLanguage = () => {
  const t = (key) => {
    const translations = {
      'manage_messages': 'Manage Messages',
      'customer_messages_and_inquiries': 'Customer messages and inquiries',
      'unread': 'Unread',
      'urgent': 'Urgent',
      'inbox': 'Inbox',
      'search_messages': 'Search messages...',
      'all_messages': 'All Messages',
      'read': 'Read',
      'replied': 'Replied',
      'no_messages_match_search': 'No messages match your search.',
      'message_details': 'Message Details',
      'close': 'Close',
      'reply': 'Reply',
      'reply_to_message': 'Reply to Message',
      'your_reply': 'Your Reply',
      'type_your_reply_here': 'Type your reply here...',
      'cancel': 'Cancel',
      'send_reply': 'Send Reply',
      'received_at': 'Received at',
      'replied_at': 'Replied at',
      'loading': 'Loading',
      'success_read': 'Message marked as read.',
      'success_unread': 'Message marked as unread.',
      'success_delete': 'Message deleted.',
      'success_reply': 'Reply sent successfully.',
    };
    return translations[key] || key;
  };
  return { t, language: 'en' };
};

const useTheme = () => ({ theme: 'light' });

const getStatusBadge = (status) => {
  switch (status) {
    case 'read':
      return { label: 'Read', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: MailOpen };
    case 'replied':
      return { label: 'Replied', color: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200', icon: Reply };
    default: // unread
      return { label: 'Unread', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200', icon: Mail };
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' };
    default: // normal
      return { label: 'Normal', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const messageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  hover: { scale: 1.01, backgroundColor: 'rgba(239, 246, 255, 0.5)' }, // Tailwind's bg-blue-50/50
};

// --- Corrected Component Code ---
const MessagesManager = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch("http://localhost:1337/api/message-ajwans", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch messages');
        }
        const apiData = await res.json();
        
        // Map the API data to the component's expected data structure
        const formattedMessages = apiData.data.map(item => ({
          id: item.id,
          documentId: item.documentId || item.id, // استخدام documentId إذا كان موجوداً، وإلا استخدام id
          name: item.attributes?.Full_Name || item.Full_Name,
          email: item.attributes?.Email_Address || item.Email_Address,
          phone: item.attributes?.Phone_Number || item.Phone_Number,
          subject: (item.attributes?.Project_Details || item.Project_Details).substring(0, 50) + '...', // Create a subject from the first 50 chars of the content
          content: item.attributes?.Project_Details || item.Project_Details,
          status: 'unread', // Assuming new messages are unread
          priority: 'normal', // You may need to add a priority field to your API data
          createdAt: item.attributes?.createdAt || item.createdAt,
          repliedAt: null, // Assuming no replied date for new messages
        }));

        setMessages(formattedMessages);
      } catch (err) {
        setError('Failed to load messages');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()); // Added content to search
    const matchesFilter =
      filterStatus === 'all' || message.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- Implemented Missing Functions ---
  const handleMarkAsRead = (id) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === id) {
          const newStatus = msg.status === 'unread' ? 'read' : 'unread';
          // In a real app, you would make an API call here to update the status.
          console.log(`Simulating API call to change status for message ${id} to ${newStatus}`);
          return { ...msg, status: newStatus };
        }
        return msg;
      })
    );
  };

  // دالة لحذف الرسالة باستخدام documentId
  const handleDeleteMessage = async (documentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found. Cannot perform action.');
      return;
    }

    try {
      // API call to delete the message using documentId
      const response = await fetch(`http://localhost:1337/api/message-ajwans/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Update state to remove the deleted message
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.documentId !== documentId));
      console.log('Message deleted successfully.');

      // Close the detail view if the deleted message was selected
      if (selectedMessage && selectedMessage.documentId === documentId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReply = (message) => {
    setSelectedMessage(message);
    setShowReplyForm(true);
  };

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    // In a real app, you would make an API call to send the reply.
    console.log(`Simulating API call to send reply for message ${selectedMessage.id}: "${replyContent}"`);

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === selectedMessage.id
          ? { ...msg, status: 'replied', repliedAt: new Date().toISOString() }
          : msg
      )
    );

    setReplyContent('');
    setShowReplyForm(false);
    setSelectedMessage(null);
  };

  if (loading) return <p className="p-6">{t('loading')}...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 bg-white dark:bg-gray-900 min-h-screen p-6 font-[Inter]"
    >
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('manage_messages')}
            </h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">
              {t('customer_messages_and_inquiries')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800 border-0 dark:bg-blue-800 dark:text-blue-100">
                {messages.filter((m) => m.status === 'unread').length} {t('unread')}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border-0 dark:bg-red-800 dark:text-red-100">
                {messages.filter((m) => m.priority === 'urgent').length}{' '}
                {t('urgent')}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="dark:text-white">{t('inbox')}</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('search_messages')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="all">{t('all_messages')}</option>
                  <option value="unread">{t('unread')}</option>
                  <option value="read">{t('read')}</option>
                  <option value="replied">{t('replied')}</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {filteredMessages.map((message, index) => {
                  const statusConfig = getStatusBadge(message.status);
                  const priorityConfig = getPriorityBadge(message.priority);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={message.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover="hover"
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        message.status === 'unread'
                          ? 'border-blue-200 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-900/30'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-blue-800">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3
                                className={`text-sm font-medium ${
                                  message.status === 'unread'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {message.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={`${priorityConfig.color} border-0 text-xs`}>
                                  {priorityConfig.label}
                                </Badge>
                                <Badge className={`${statusConfig.color} border-0 text-xs`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>
                            <p
                              className={`text-sm mb-2 ${
                                message.status === 'unread'
                                  ? 'text-gray-900 font-medium dark:text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {message.subject}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2 dark:text-gray-400">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {message.email}
                                </span>
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {message.phone}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mr-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReply(message);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                          >
                            <Reply className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(message.id);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                          >
                            {message.status === 'unread' ? (
                              <MailOpen className="w-4 h-4" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.documentId); // استخدام documentId بدلاً من id
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('no_messages_match_search')}
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && !showReplyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('message_details')}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-800">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedMessage.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedMessage.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedMessage.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const statusConfig = getStatusBadge(selectedMessage.status);
                      const priorityConfig = getPriorityBadge(selectedMessage.priority);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <>
                          <Badge className={`${priorityConfig.color} border-0 text-xs`}>
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={`${statusConfig.color} border-0 text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                    {selectedMessage.subject}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap dark:text-gray-300">
                    {selectedMessage.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-4 dark:border-gray-700 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {t('received_at')}: {formatDate(selectedMessage.createdAt)}
                    </span>
                  </div>
                  {selectedMessage.repliedAt && (
                    <div className="flex items-center">
                      <Reply className="w-4 h-4 mr-2" />
                      <span>
                        {t('replied_at')}: {formatDate(selectedMessage.repliedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                  className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {t('close')}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleReply(selectedMessage)}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    {t('reply')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Form Modal */}
      <AnimatePresence>
        {showReplyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('reply_to_message')}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowReplyForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="replyContent" className="dark:text-gray-200">
                    {t('your_reply')}
                  </Label>
                  <Textarea
                    id="replyContent"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('type_your_reply_here')}
                    rows={8}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowReplyForm(false)}
                  className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSendReply}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                    disabled={!replyContent.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {t('send_reply')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main App component to render the MessagesManager
export default MessagesManager;