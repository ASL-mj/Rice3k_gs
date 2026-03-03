import React, { useState } from 'react';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styles from '../styles/ReportPage.module.css';

const ReportPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    {
      id: 'R001',
      taskName: 'Data Analysis Report',
      status: 'Completed',
      time: '2024-03-01 11:30',
      userInput: 'Analyze sales data for Q1 2024',
      files: ['sales_q1.csv', 'analysis_config.json'],
      steps: ['Data Loading', 'Data Cleaning', 'Statistical Analysis', 'Visualization'],
    },
    {
      id: 'R002',
      taskName: 'Model Training Report',
      status: 'Completed',
      time: '2024-03-01 10:15',
      userInput: 'Train ML model on customer data',
      files: ['customer_data.csv', 'model_config.py'],
      steps: ['Data Preprocessing', 'Feature Engineering', 'Model Training', 'Evaluation'],
    },
    {
      id: 'R003',
      taskName: 'Performance Analysis',
      status: 'Running',
      time: '2024-03-01 14:00',
      userInput: 'Analyze system performance metrics',
      files: ['metrics.log', 'config.yaml'],
      steps: ['Data Collection', 'Metric Calculation', 'Trend Analysis'],
    },
    {
      id: 'R004',
      taskName: 'User Behavior Study',
      status: 'Failed',
      time: '2024-03-01 09:45',
      userInput: 'Study user interaction patterns',
      files: ['user_logs.json'],
      steps: ['Log Parsing', 'Pattern Recognition'],
    },
    {
      id: 'R005',
      taskName: 'Market Research',
      status: 'Completed',
      time: '2024-02-28 16:20',
      userInput: 'Research market trends',
      files: ['market_data.xlsx', 'trends.pdf'],
      steps: ['Data Collection', 'Trend Analysis', 'Report Generation'],
    },
    {
      id: 'R006',
      taskName: 'Quality Assessment',
      status: 'Completed',
      time: '2024-02-28 13:10',
      userInput: 'Assess product quality metrics',
      files: ['quality_data.csv'],
      steps: ['Data Validation', 'Quality Scoring', 'Summary Report'],
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'Running':
        return <ClockCircleOutlined style={{ color: '#f59e0b' }} />;
      case 'Failed':
        return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: '#10b981',
      Running: '#f59e0b',
      Failed: '#ef4444',
    };
    return colors[status] || '#666';
  };

  if (selectedReport) {
    return (
      <div className={styles.container}>
        <button 
          className={styles.backBtn}
          onClick={() => setSelectedReport(null)}
        >
          ← Back to Reports
        </button>
        
        <div className={styles.detailContainer}>
          <div className={styles.detailSection}>
            <h2 className={styles.detailTitle}>Report Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Report ID:</span>
                <span className={styles.infoValue}>{selectedReport.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Task Name:</span>
                <span className={styles.infoValue}>{selectedReport.taskName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status:</span>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(selectedReport.status) }}
                >
                  {getStatusIcon(selectedReport.status)} {selectedReport.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Time:</span>
                <span className={styles.infoValue}>{selectedReport.time}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>User Input:</span>
                <span className={styles.infoValue}>{selectedReport.userInput}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Files:</span>
                <div className={styles.fileList}>
                  {selectedReport.files.map((file, idx) => (
                    <span key={idx} className={styles.fileTag}>{file}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h2 className={styles.detailTitle}>Analysis Steps</h2>
            <div className={styles.stepsTimeline}>
              {selectedReport.steps.map((step, idx) => (
                <div key={idx} className={styles.stepItem}>
                  <div className={styles.stepNumber}>{idx + 1}</div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepName}>{step}</div>
                    <div className={styles.stepDescription}>
                      Step {idx + 1} completed successfully
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h2 className={styles.detailTitle}>Report Content</h2>
            <div className={styles.reportContent}>
              <p>This is a placeholder for the detailed report content. In a real application, this would contain the actual analysis results, charts, tables, and conclusions generated by the agent.</p>
              <p>The report would include:</p>
              <ul>
                <li>Executive Summary</li>
                <li>Detailed Analysis Results</li>
                <li>Data Visualizations</li>
                <li>Key Findings</li>
                <li>Recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Agent Analysis Reports</h1>

      <div className={styles.reportsGrid}>
        {reports.map((report) => (
          <div key={report.id} className={styles.reportCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{report.taskName}</h3>
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(report.status) }}
              >
                {getStatusIcon(report.status)} {report.status}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Time:</span>
                <span className={styles.cardValue}>{report.time}</span>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>User Input:</span>
                <span className={styles.cardValue}>{report.userInput}</span>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Related Files:</span>
                <div className={styles.fileList}>
                  {report.files.map((file, idx) => (
                    <span key={idx} className={styles.fileTag}>{file}</span>
                  ))}
                </div>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Analysis Steps:</span>
                <div className={styles.stepsList}>
                  {report.steps.map((step, idx) => (
                    <span key={idx} className={styles.stepBadge}>
                      {idx + 1}. {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button 
                className={styles.viewBtn}
                onClick={() => setSelectedReport(report)}
              >
                <EyeOutlined /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportPage;