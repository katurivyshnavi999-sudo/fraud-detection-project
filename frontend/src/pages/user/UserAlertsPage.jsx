import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ALL_SIMULATED_ALERTS } from '../../services/simulatedData';
import { alertsAPI } from '../../services/api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Check,
  ChevronRight,
  Filter,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserAlertsPage = () => {
  const { currentUser, selectedUserId } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD'

  const normalizeAlert = (a) => ({
    id: a.id || a.alert_id,
    alert_id: a.alert_id || a.id,
    userId: a.userId || a.user_id,
    transactionId: a.transactionId || a.transaction_id,
    alertType: a.alertType || a.alert_type,
    riskLevel: (a.riskLevel || a.risk_level || 'Medium').toUpperCase(),
    message: a.message,
    isRead: a.isRead !== undefined ? a.isRead : a.is_read,
    timestamp: a.timestamp || a.created_at || new Date().toISOString()
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertsAPI.getUserAlerts(selectedUserId);
      if (Array.isArray(data) && data.length > 0) {
        setAlerts(data.map(normalizeAlert));
      } else {
        const fallback = ALL_SIMULATED_ALERTS.filter((a) => a.userId === selectedUserId).map(normalizeAlert);
        setAlerts(fallback);
      }
    } catch (err) {
      const fallback = ALL_SIMULATED_ALERTS.filter((a) => a.userId === selectedUserId).map(normalizeAlert);
      setAlerts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedUserId]);

  const markAllRead = () => {
    alerts.forEach((a) => {
      if (!a.isRead) {
        alertsAPI.markAsRead(a.id).catch(() => {});
      }
    });
    setAlerts(alerts.map((a) => ({ ...a, isRead: true })));
  };

  const toggleRead = (id) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert && !alert.isRead) {
      alertsAPI.markAsRead(id).catch(() => {});
    }
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, isRead: !a.isRead } : a)));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'UNREAD') return !a.isRead;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Alerts & Warnings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fraud warnings and account verification events for <span className="font-semibold text-slate-800">{currentUser?.name}</span> ({currentUser?.id})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setFilterType('UNREAD')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'UNREAD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-blue-600" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {filterType === 'UNREAD' ? 'No unread alerts' : 'No security alerts on record'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your account <span className="font-semibold">{currentUser?.name}</span> has no outstanding security flags. PayGuard AI defense is actively monitoring your payment stream.
            </p>
            {filterType === 'UNREAD' && alerts.length > 0 && (
              <button
                onClick={() => setFilterType('ALL')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                View Read Alerts
              </button>
            )}
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition-all ${
                alert.isRead
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-blue-50/50 border-blue-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    alert.riskLevel === 'HIGH' || alert.riskLevel === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-600'
                      : alert.riskLevel === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{alert.alertType}</span>
                      <StatusBadge status={alert.riskLevel} type="risk" />
                      {!alert.isRead && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-400 font-mono">
                      <span>Alert ID: <strong className="text-slate-600">{alert.id}</strong></span>
                      <span>TXN ID: <strong className="text-slate-600">{alert.transactionId}</strong></span>
                      <span>Time: {alert.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => toggleRead(alert.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {alert.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserAlertsPage;
