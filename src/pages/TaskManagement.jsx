import React, { useState } from 'react';
import { SearchOutlined, FilterOutlined, EyeOutlined, StopOutlined, ReloadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from '../styles/TaskManagement.module.css';
import { Descriptions } from 'antd';

const TaskManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { label: 'Total Tasks', value: 156, color: '#1a73e8' },
    { label: 'Pedding', value: 23, color: '#f59e0b' },
    { label: 'Running', value: 45, color: '#10b981' },
    { label: 'Completed', value: 78, color: '#6366f1' },
    { label: 'Failed', value: 10, color: '#ef4444' },
  ];

  const tasks = [
    {
      id: 'T001',
      name: 'Data Analysis Task',
      status: 'Running',
      startTime: '2024-03-01 10:30',
      endTime: '-',
      files: ['data.csv', 'config.json'],
    },
    {
      id: 'T002',
      name: 'Model Training',
      status: 'Completed',
      startTime: '2024-03-01 09:00',
      endTime: '2024-03-01 11:30',
      files: ['model.py', 'dataset.csv'],
    },
    {
      id: 'T003',
      name: 'Report Generation',
      status: 'Planning',
      startTime: '2024-03-01 14:00',
      endTime: '-',
      files: ['template.docx'],
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      Planning: '#f59e0b',
      Running: '#10b981',
      Completed: '#6366f1',
      Failed: '#ef4444',
    };
    return colors[status] || '#666';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Agent Task Management</h1>
      <p>manage and monitor execution status of all agent tasks</p>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard} style={{ borderTopColor: stat.color }}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableHeader}>
        <div className={styles.searchBar}>
          <SearchOutlined className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by task name,description,agent or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="Planning">Planning</option>
          <option value="Running">Running</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Files</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td className={styles.taskId}>{task.id}</td>
                <td className={styles.taskName}>{task.name}</td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </td>
                <td>{task.startTime}</td>
                <td>{task.endTime}</td>
                <td>
                  <div className={styles.fileList}>
                    {task.files.map((file, idx) => (
                      <span key={idx} className={styles.fileTag}>{file}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="View">
                      <EyeOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Stop">
                      <StopOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Restart">
                      <ReloadOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Download Report">
                      <DownloadOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Delete">
                      <DeleteOutlined />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskManagement;