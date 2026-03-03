import React, { useState } from 'react';
import { QuestionCircleOutlined, BookOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import styles from '../styles/HelpFeedback.module.css';

const HelpFeedback = () => {
  const [feedbackText, setFeedbackText] = useState('');

  const quickStartItems = [
    { title: 'Getting Started', desc: 'Learn the basics of using Rice AI' },
    { title: 'Creating Your First Task', desc: 'Step-by-step guide to create tasks' },
    { title: 'Understanding Reports', desc: 'How to read and interpret reports' },
  ];

  const userGuides = [
    { title: 'Task Management Guide', desc: 'Complete guide to managing tasks' },
    { title: 'Report Analysis', desc: 'Advanced report analysis techniques' },
    { title: 'Best Practices', desc: 'Tips for optimal usage' },
    { title: 'API Integration', desc: 'Integrate Rice AI with your workflow' },
  ];

  const faqs = [
    {
      question: 'How do I create a new task?',
      answer: 'Click on the "New Task" button in the Task Management page, fill in the required information, and click "Create".'
    },
    {
      question: 'Can I export my reports?',
      answer: 'Yes, you can export reports in PDF or CSV format by clicking the download button on the report page.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Account Settings > Security, and follow the password change process.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support CSV, JSON, XLSX, TXT, and PDF files for data analysis.'
    },
  ];

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      alert('Thank you for your feedback!');
      setFeedbackText('');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Help & Feedback Center</h1>
      <p className={styles.subtitle}>
        Find answers to your questions, learn how to use our AI agent, and share your feedback to help us improve.
      </p>

      {/* Quick Start */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <QuestionCircleOutlined className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Quick Start</h2>
        </div>
        <p className={styles.sectionDesc}>Get started with our AI agent in minutes</p>
        
        <div className={styles.cardGrid}>
          {quickStartItems.map((item, index) => (
            <div key={index} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
              <button className={styles.cardBtn}>Learn More →</button>
            </div>
          ))}
        </div>
      </section>

      {/* User Guide */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <BookOutlined className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>User Guide</h2>
        </div>
        <p className={styles.sectionDesc}>Learn advanced features and best practices</p>
        
        <div className={styles.guideList}>
          {userGuides.map((guide, index) => (
            <div key={index} className={styles.guideItem}>
              <div className={styles.guideContent}>
                <h3 className={styles.guideTitle}>{guide.title}</h3>
                <p className={styles.guideDesc}>{guide.desc}</p>
              </div>
              <button className={styles.guideBtn}>Read →</button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <QuestionCircleOutlined className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        </div>
        <p className={styles.sectionDesc}>Quick answers to common questions</p>
        
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <details key={index} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{faq.question}</summary>
              <p className={styles.faqAnswer}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* User Feedback */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <MessageOutlined className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>User Feedback</h2>
        </div>
        <p className={styles.sectionDesc}>We'd love to hear from you</p>
        
        <form className={styles.feedbackForm} onSubmit={handleSubmitFeedback}>
          <textarea
            className={styles.feedbackTextarea}
            placeholder="Share your thoughts, suggestions, or report issues..."
            rows={6}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <button type="submit" className={styles.submitBtn}>
            <SendOutlined /> Submit Feedback
          </button>
        </form>
      </section>
    </div>
  );
};

export default HelpFeedback;