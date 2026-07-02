import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard.jsx';
import { validateTicket, getAdminStats, getPendingUpiOrders, approveUpiOrder, rejectUpiOrder, ApiError } from '../../lib/api.js';

export default function AdminScanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const lastScanRef = useRef('');

  const [activeTab, setActiveTab] = useState('validate');
  const [stats, setStats] = useState(null);
  const [result, setResult] = useState(null); // { valid, ... }
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [jsQRLoaded, setJsQRLoaded] = useState(!!window.jsQR);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const refreshStats = useCallback(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  const fetchPending = useCallback(() => {
    setLoadingPending(true);
    getPendingUpiOrders()
      .then((res) => {
        if (res.success) {
          setPendingOrders(res.orders || []);
        }
      })
      .catch((err) => {
        setPendingError(err instanceof ApiError ? err.message : 'Could not fetch pending payments.');
      })
      .finally(() => {
        setLoadingPending(false);
      });
  }, []);

  useEffect(() => {
    refreshStats();
    fetchPending();
    const id = setInterval(() => {
      refreshStats();
      fetchPending();
    }, 15000);
    return () => clearInterval(id);
  }, [refreshStats, fetchPending]);

  // Load jsQR from CDN
  useEffect(() => {
    if (window.jsQR) {
      setJsQRLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js';
    script.onload = () => setJsQRLoaded(true);
    document.body.appendChild(script);
  }, []);

  async function startScanning() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      tick();
    } catch (err) {
      setCameraError('Could not access camera. Check permissions or use manual entry below.');
    }
  }

  function stopScanning() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function tick() {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        // Debounce repeat scans of the same code for 2s
        setTimeout(() => { lastScanRef.current = ''; }, 2000);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => stopScanning(), []);

  async function handleScan(ticketId) {
    try {
      const res = await validateTicket(ticketId, 'Gate Scanner');
      setResult(res);
      refreshStats();
    } catch (err) {
      setResult({
        valid: false,
        code: 'ERROR',
        reason: err instanceof ApiError ? err.message : 'Could not validate ticket.',
      });
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleScan(manualId.trim());
    setManualId('');
  }

  return (
    <div className="min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bone-100/10 pb-5">
          <div>
            <p className="label-eyebrow">Gate control</p>
            <h1 className="font-display text-3xl uppercase text-bone-100">Admin Dashboard</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_authed');
              navigate('/admin');
            }}
            className="font-mono text-xs text-bone-600 hover:text-bone-400"
          >
            Sign out
          </button>
        </div>

        {/* Tab switcher navigation */}
        <div className="mt-6 flex border-b border-bone-100/10">
          <button
            onClick={() => {
              setActiveTab('validate');
              stopScanning();
            }}
            className={`pb-3.5 pt-2 px-4 font-body text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
              activeTab === 'validate'
                ? 'border-coral-500 text-bone-100'
                : 'border-transparent text-bone-500 hover:text-bone-300'
            }`}
          >
            Validate Tickets
          </button>
          <button
            onClick={() => {
              setActiveTab('approve');
              stopScanning();
            }}
            className={`pb-3.5 pt-2 px-4 font-body text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'approve'
                ? 'border-amber-500 text-bone-100'
                : 'border-transparent text-bone-500 hover:text-bone-300'
            }`}
          >
            Approve Payments
            {pendingOrders.length > 0 && (
              <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                {pendingOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Live dashboard stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Checked in" value={stats.checkedIn} accent="coral" />
            <StatCard label="Remaining" value={stats.remaining} accent="amber" />
            <StatCard label="Total tickets" value={stats.totalTickets} />
          </div>
        )}

        {/* Tab 1 content: Ticket Validator */}
        {activeTab === 'validate' && (
          <div className="mt-6 space-y-5 animate-rise" style={{ animationDuration: '0.4s' }}>
            <div className="card overflow-hidden">
              <div className="relative aspect-square w-full bg-ink-950 sm:aspect-video">
                <video
                  ref={videoRef}
                  className={`h-full w-full object-cover ${scanning ? 'block' : 'hidden'}`}
                  playsInline
                  muted
                />
                {!scanning && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="font-mono text-sm text-bone-500">
                      {jsQRLoaded ? 'Camera is off' : 'Loading scanner…'}
                    </p>
                    <button
                      onClick={startScanning}
                      disabled={!jsQRLoaded}
                      className="btn-primary"
                    >
                      Start camera
                    </button>
                  </div>
                )}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-2/3 w-2/3 rounded-2xl border-2 border-coral-400/70" />
                  </div>
                )}
              </div>

              {scanning && (
                <button
                  onClick={stopScanning}
                  className="w-full border-t border-bone-100/10 py-3 font-mono text-xs text-bone-500 hover:text-bone-300"
                >
                  Stop camera
                </button>
              )}

              {cameraError && (
                <p className="border-t border-bone-100/10 px-5 py-3 text-center font-body text-sm text-coral-400">
                  {cameraError}
                </p>
              )}
            </div>

            {/* Manual check form */}
            <form onSubmit={handleManualSubmit} className="card flex gap-2 p-4">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Or enter ticket ID manually"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-secondary">Check</button>
            </form>

            {/* Result scan display */}
            {result && <ResultCard result={result} onNext={() => setResult(null)} />}
          </div>
        )}

        {/* Tab 2 content: UPI approvals queue */}
        {activeTab === 'approve' && (
          <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
            <PendingApprovalsSection
              orders={pendingOrders}
              loading={loadingPending}
              error={pendingError}
              fetchPending={fetchPending}
              refreshStats={refreshStats}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PendingApprovalsSection({ orders, loading, error, fetchPending, refreshStats }) {
  const [actionLoading, setActionLoading] = useState(null);

  async function handleApprove(orderId) {
    if (!window.confirm('Are you sure you want to approve this payment? This will generate tickets and send them via email.')) return;
    setActionLoading(orderId);
    try {
      await approveUpiOrder(orderId);
      fetchPending();
      refreshStats();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(orderId) {
    if (!window.confirm('Are you sure you want to reject this payment? This will mark the order as failed.')) return;
    setActionLoading(orderId);
    try {
      await rejectUpiOrder(orderId);
      fetchPending();
      refreshStats();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label-eyebrow">Verification Queue</p>
        <h2 className="font-display text-2xl uppercase text-bone-100">UPI Payment Approvals</h2>
      </div>

      {error && (
        <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400 border border-coral-500/20">
          {error}
        </p>
      )}

      {loading && orders.length === 0 ? (
        <div className="card p-6 text-center text-bone-500 font-mono text-xs animate-pulse">
          Loading pending queue…
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-6 text-center text-bone-500 font-mono text-xs">
          No pending UPI approvals found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.orderId} className="card p-5 space-y-4 border-bone-100/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-body font-bold text-bone-100 text-sm">{o.name}</h3>
                  <p className="font-mono text-xs text-bone-500 mt-0.5">{o.email} &middot; {o.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-lg text-amber-400 font-bold">₹{o.totalAmount.toLocaleString('en-IN')}</span>
                  <p className="font-mono text-[10px] text-bone-500 mt-0.5">{o.quantity} &times; {o.ticketType}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ink-950/40 rounded-xl p-3 border border-bone-100/5">
                <div className="font-mono text-xs">
                  <span className="text-bone-500 uppercase tracking-wider block text-[9px] mb-0.5">UTR / Txn ID</span>
                  <span className="text-bone-200 font-bold text-sm tracking-wide">{o.upiTransactionId}</span>
                </div>
                <div className="font-mono text-xs text-right sm:text-left">
                  <span className="text-bone-500 uppercase tracking-wider block text-[9px] mb-0.5">Billing ID</span>
                  <span className="text-bone-300 font-medium">{o.orderId}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => handleApprove(o.orderId)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-ink-950 font-body font-bold text-xs py-2 px-3 transition-colors disabled:opacity-50"
                >
                  {actionLoading === o.orderId ? 'Processing…' : 'Approve & Issue Ticket'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => handleReject(o.orderId)}
                  className="inline-flex items-center justify-center rounded-lg border border-coral-500/30 text-coral-400 hover:border-coral-500 hover:bg-coral-500/10 font-body font-semibold text-xs py-2 px-3 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, onNext }) {
  if (result.valid) {
    return (
      <div className="card mt-5 border-amber-500/30 bg-amber-500/[0.06] p-6 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">Entry granted</h2>
        <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
        <p className="font-body text-sm text-bone-400">{result.ticketType} Ticket</p>
        <p className="mt-1 font-mono text-xs text-amber-400">
          Ticket {result.ticketNumber} of {result.totalInOrder}
        </p>
        <p className="mt-1 font-mono text-xs text-bone-600">Checked in at {result.checkedInAt}</p>
        <button onClick={onNext} className="btn-primary mt-5 w-full">
          Next person
        </button>
      </div>
    );
  }

  return (
    <div className="card mt-5 border-coral-500/30 bg-coral-500/[0.06] p-6 text-center">
      <p className="text-3xl">❌</p>
      <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">
        {result.code === 'ALREADY_USED' ? 'Already checked in' : 'Entry denied'}
      </h2>
      {result.attendeeName && (
        <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
      )}
      {result.ticketNumber && (
        <p className="font-mono text-xs text-coral-400">
          Ticket {result.ticketNumber} of {result.totalInOrder}
        </p>
      )}
      <p className="mt-2 font-body text-sm text-bone-400">{result.reason}</p>
      {result.usedAt && (
        <p className="mt-1 font-mono text-xs text-bone-600">
          Was checked in at {new Date(result.usedAt).toLocaleTimeString('en-IN')}
        </p>
      )}
      <button onClick={onNext} className="btn-secondary mt-5 w-full">
        Try again
      </button>
    </div>
  );
}
