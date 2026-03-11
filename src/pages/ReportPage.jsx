import React, { useEffect, useState } from 'react';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styles from '../styles/ReportPage.module.css';
import { message } from 'antd';
import { reportsApi } from '../utils/api';

const ReportPage = ({ accessToken, isLoggedIn, onShowLoginModal }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadReports = async () => {
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    try {
      const resp = await reportsApi.list(accessToken);
      setReports(resp.reports || []);
    } catch (error) {
      message.error(error.message || 'Failed to load reports.');
    }
  };

  useEffect(() => {
    loadReports();
  }, [accessToken, isLoggedIn]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ color: '#f59e0b' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      running: '#f59e0b',
      failed: '#ef4444',
    };
    return colors[(status || '').toLowerCase()] || '#666';
  };

  const formatReport = (report) => {
    const task = report.task || {};
    const status = task.status || report.status || 'completed';
    return {
      id: report.report_id || report.id,
      taskName: task.task_name || task.tool_name || report.tool_name || 'Report',
      status,
      time: report.created_at || task.completed_at || task.created_at,
      userInput: task.user_input || '-',
      files: Array.isArray(task.input_files)
        ? task.input_files
        : task.input_files
        ? [task.input_files]
        : [],
      steps: task.steps || [],
      task,
      attachments: report.attachments || [],
    };
  };

  const handleViewReport = async (report) => {
    if (!report) return;
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    const reportId = report.report_id || report.id;
    if (!reportId) {
      message.error('Report ID not found.');
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await reportsApi.get(accessToken, reportId);
      setSelectedReport(detail);
    } catch (error) {
      message.error(error.message || 'Failed to load report detail.');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (selectedReport) {
    const formatted = formatReport(selectedReport);
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
                <span className={styles.infoValue}>{formatted.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Task Name:</span>
                <span className={styles.infoValue}>{formatted.taskName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status:</span>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(formatted.status) }}
                >
                  {getStatusIcon(formatted.status)} {formatted.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Time:</span>
                <span className={styles.infoValue}>{formatted.time}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>User Input:</span>
                <span className={styles.infoValue}>{formatted.userInput}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Files:</span>
                <div className={styles.fileList}>
                  {formatted.files.map((file, idx) => (
                    <span key={idx} className={styles.fileTag}>{file}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h2 className={styles.detailTitle}>Analysis Steps</h2>
            <div className={styles.stepsTimeline}>
              {(formatted.steps || []).map((step, idx) => (
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
              <p>Report data is available via task results and attachments.</p>
            </div>
          </div>

          {loadingDetail ? (
            <div className={styles.detailSection}>
              <h2 className={styles.detailTitle}>Attachments</h2>
              <div>Loading...</div>
            </div>
          ) : formatted.attachments?.length ? (
            <div className={styles.detailSection}>
              <h2 className={styles.detailTitle}>Attachments</h2>
              <div className={styles.attachmentList}>
                {formatted.attachments.map((item, idx) => {
                  const key = `${formatted.id}-att-${idx}`;
                  const src = item.image_base64
                    ? `data:image/png;base64,${item.image_base64}`
                    : item.download_url;
                  return (
                    <div className={styles.attachmentCard} key={key}>
                      {src && (
                        <img src={src} alt="attachment" className={styles.attachmentImage} />
                      )}
                      <div className={styles.attachmentMeta}>
                        <span>{item.file_name || 'image.png'}</span>
                        {item.download_url && (
                          <a className={styles.attachmentBtn} href={item.download_url}>
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Agent Analysis Reports</h1>

      <div className={styles.reportsGrid}>
        {reports.map((report) => {
          const formatted = formatReport(report);
          return (
          <div key={formatted.id} className={styles.reportCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{formatted.taskName}</h3>
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(formatted.status) }}
              >
                {getStatusIcon(formatted.status)} {formatted.status}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Time:</span>
                <span className={styles.cardValue}>{formatted.time}</span>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>User Input:</span>
                <span className={styles.cardValue}>{formatted.userInput}</span>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Related Files:</span>
                <div className={styles.fileList}>
                  {formatted.files.map((file, idx) => (
                    <span key={idx} className={styles.fileTag}>{file}</span>
                  ))}
                </div>
              </div>

              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>Analysis Steps:</span>
                <div className={styles.stepsList}>
                  {(formatted.steps || []).map((step, idx) => (
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
                onClick={() => handleViewReport(report)}
              >
                <EyeOutlined /> View Details
              </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default ReportPage;
