import React, { useEffect, useMemo, useState } from 'react';
import {
  SearchOutlined,
  EyeOutlined,
  StopOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import styles from '../styles/TaskManagement.module.css';
import { Descriptions, Modal, message } from 'antd';
import { tasksApi } from '../utils/api';

const TaskManagement = ({ accessToken, isLoggedIn, onShowLoginModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const total = tasks.length;
    const countByStatus = tasks.reduce((acc, task) => {
      const status = (task.status || '').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return [
      { label: 'Total Tasks', value: total, color: '#1a73e8' },
      { label: 'Pending', value: countByStatus.pending || 0, color: '#f59e0b' },
      { label: 'Running', value: countByStatus.running || 0, color: '#10b981' },
      { label: 'Completed', value: countByStatus.completed || 0, color: '#6366f1' },
      { label: 'Failed', value: countByStatus.failed || 0, color: '#ef4444' },
    ];
  }, [tasks]);

  const loadTasks = async (status) => {
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    setLoading(true);
    try {
      const resp = await tasksApi.list(accessToken, status && status !== 'all' ? status : null);
      setTasks(resp.tasks || []);
    } catch (error) {
      message.error(error.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      running: '#10b981',
      completed: '#6366f1',
      failed: '#ef4444',
      cancelled: '#9ca3af',
    };
    return colors[(status || '').toLowerCase()] || '#666';
  };

  useEffect(() => {
    loadTasks(filterStatus);
  }, [filterStatus]);

  const filteredTasks = tasks.filter((task) => {
    const taskName = task.task_name || task.tool_name || '';
    const taskId = task.task_id || task.id || '';
    const matchesSearch =
      taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || (task.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const downloadTask = async (task) => {
    try {
      const blob = await tasksApi.download(accessToken, task.task_id || task.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `task-${task.task_id || task.id}-outputs.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(error.message || 'Download failed.');
    }
  };

  const restartTask = async (task) => {
    try {
      await tasksApi.restart(accessToken, task.task_id || task.id);
      message.success('Task restarted.');
      loadTasks(filterStatus);
    } catch (error) {
      message.error(error.message || 'Restart failed.');
    }
  };

  const cancelTask = async (task) => {
    try {
      await tasksApi.cancel(accessToken, task.task_id || task.id);
      message.success('Task cancelled.');
      loadTasks(filterStatus);
    } catch (error) {
      message.error(error.message || 'Cancel failed.');
    }
  };

  const deleteTask = async (task) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task? This cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tasksApi.delete(accessToken, task.task_id || task.id);
          message.success('Task deleted.');
          loadTasks(filterStatus);
        } catch (error) {
          message.error(error.message || 'Delete failed.');
        }
      },
    });
  };

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
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
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
              <tr key={task.task_id || task.id}>
                <td className={styles.taskId}>{task.task_id || task.id}</td>
                <td className={styles.taskName}>{task.task_name || task.tool_name}</td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {(task.status || '').toUpperCase()}
                  </span>
                </td>
                <td>{task.started_at || '-'}</td>
                <td>{task.completed_at || '-'}</td>
                <td>
                  <div className={styles.fileList}>
                    {(Array.isArray(task.input_files) ? task.input_files : task.input_files ? [task.input_files] : []).map((file, idx) => (
                      <span key={idx} className={styles.fileTag}>
                        {String(file).split('/').pop()}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      title="View"
                      onClick={() => setSelectedTask(task)}
                    >
                      <EyeOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Stop" onClick={() => cancelTask(task)}>
                      <StopOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Restart" onClick={() => restartTask(task)}>
                      <ReloadOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Download Results" onClick={() => downloadTask(task)}>
                      <DownloadOutlined />
                    </button>
                    <button className={styles.actionBtn} title="Delete" onClick={() => deleteTask(task)}>
                      <DeleteOutlined />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selectedTask)}
        title="Task Details"
        onCancel={() => setSelectedTask(null)}
        footer={null}
      >
        {selectedTask && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Task ID">
              {selectedTask.task_id || selectedTask.id}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {selectedTask.task_name || selectedTask.tool_name}
            </Descriptions.Item>
            <Descriptions.Item label="Status">{selectedTask.status}</Descriptions.Item>
            <Descriptions.Item label="User Input">
              {selectedTask.user_input || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Started At">
              {selectedTask.started_at || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {selectedTask.completed_at || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Input Files">
              {(Array.isArray(selectedTask.input_files)
                ? selectedTask.input_files
                : selectedTask.input_files
                ? [selectedTask.input_files]
                : []
              )
                .map((file) => String(file).split('/').pop())
                .join(', ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Output Files">
              {(Array.isArray(selectedTask.output_files)
                ? selectedTask.output_files
                : selectedTask.output_files
                ? [selectedTask.output_files]
                : []
              )
                .map((file) => String(file).split('/').pop())
                .join(', ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Steps">
              {(selectedTask.steps || []).join(' -> ') || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskManagement;
