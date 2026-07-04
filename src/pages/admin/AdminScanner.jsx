// import { useEffect, useRef, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import StatCard from '../../components/StatCard.jsx';
// import { validateTicket, getAdminStats, getPendingUpiOrders, approveUpiOrder, rejectUpiOrder, ApiError } from '../../lib/api.js';
// import jsQR from 'jsqr';

// export default function AdminScanner() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const rafRef = useRef(null);
//   const canvasRef = useRef(document.createElement('canvas'));
//   const lastScanRef = useRef('');

//   const [activeTab, setActiveTab] = useState('validate');
//   const [stats, setStats] = useState(null);
//   const [result, setResult] = useState(null); // { valid, ... }
//   const [manualId, setManualId] = useState('');
//   const [scanning, setScanning] = useState(false);
//   const [cameraError, setCameraError] = useState('');

//   const [pendingOrders, setPendingOrders] = useState([]);
//   const [loadingPending, setLoadingPending] = useState(false);
//   const [pendingError, setPendingError] = useState('');

//   useEffect(() => {
//     if (sessionStorage.getItem('admin_authed') !== 'true') {
//       navigate('/admin');
//     }
//   }, [navigate]);

//   const refreshStats = useCallback(() => {
//     getAdminStats().then(setStats).catch(() => {});
//   }, []);

//   const fetchPending = useCallback(() => {
//     setLoadingPending(true);
//     getPendingUpiOrders()
//       .then((res) => {
//         if (res.success) {
//           setPendingOrders(res.orders || []);
//         }
//       })
//       .catch((err) => {
//         setPendingError(err instanceof ApiError ? err.message : 'Could not fetch pending payments.');
//       })
//       .finally(() => {
//         setLoadingPending(false);
//       });
//   }, []);

//   useEffect(() => {
//     refreshStats();
//     fetchPending();
//     const id = setInterval(() => {
//       refreshStats();
//       fetchPending();
//     }, 15000);
//     return () => clearInterval(id);
//   }, [refreshStats, fetchPending]);

//   async function startScanning() {
//     setCameraError('');
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       if (window.isSecureContext === false) {
//         setCameraError('Camera access requires a secure connection (HTTPS or localhost). Please access this page via HTTPS or localhost.');
//       } else {
//         setCameraError('Camera API is not supported by your browser or device.');
//       }
//       return;
//     }

//     try {
//       let stream;
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({
//           video: { facingMode: { ideal: 'environment' } },
//         });
//       } catch (err) {
//         // Fallback to any available video input if ideal facingMode fails
//         stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });
//       }
//       streamRef.current = stream;
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//       setScanning(true);
//       tick();
//     } catch (err) {
//       setCameraError('Could not access camera. Check permissions or use manual entry below.');
//     }
//   }

//   function stopScanning() {
//     setScanning(false);
//     if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//   }

//   function tick() {
//     if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
//       rafRef.current = requestAnimationFrame(tick);
//       return;
//     }

//     const canvas = canvasRef.current;
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//     if (jsQR) {
//       const code = jsQR(imageData.data, imageData.width, imageData.height);
//       if (code && code.data && code.data !== lastScanRef.current) {
//         lastScanRef.current = code.data;
//         handleScan(code.data);
//         // Debounce repeat scans of the same code for 2s
//         setTimeout(() => { lastScanRef.current = ''; }, 2000);
//       }
//     }

//     rafRef.current = requestAnimationFrame(tick);
//   }

//   useEffect(() => () => stopScanning(), []);

//   async function handleScan(ticketId) {
//     try {
//       const res = await validateTicket(ticketId, 'Gate Scanner');
//       setResult(res);
//       refreshStats();
//     } catch (err) {
//       setResult({
//         valid: false,
//         code: 'ERROR',
//         reason: err instanceof ApiError ? err.message : 'Could not validate ticket.',
//       });
//     }
//   }

//   function handleManualSubmit(e) {
//     e.preventDefault();
//     if (!manualId.trim()) return;
//     handleScan(manualId.trim());
//     setManualId('');
//   }

//   return (
//     <div className="min-h-screen px-5 py-10 sm:px-8">
//       <div className="mx-auto max-w-3xl">
//         {/* Header */}
//         <div className="flex items-center justify-between border-b border-bone-100/10 pb-5">
//           <div>
//             <p className="label-eyebrow">Gate control</p>
//             <h1 className="font-display text-3xl uppercase text-bone-100">Admin Dashboard</h1>
//           </div>
//           <button
//             onClick={() => {
//               sessionStorage.removeItem('admin_authed');
//               navigate('/admin');
//             }}
//             className="font-mono text-xs text-bone-600 hover:text-bone-400"
//           >
//             Sign out
//           </button>
//         </div>

//         {/* Tab switcher navigation */}
//         <div className="mt-6 flex border-b border-bone-100/10">
//           <button
//             onClick={() => {
//               setActiveTab('validate');
//               stopScanning();
//             }}
//             className={`pb-3.5 pt-2 px-4 font-body text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
//               activeTab === 'validate'
//                 ? 'border-coral-500 text-bone-100'
//                 : 'border-transparent text-bone-500 hover:text-bone-300'
//             }`}
//           >
//             Validate Tickets
//           </button>
//           <button
//             onClick={() => {
//               setActiveTab('approve');
//               stopScanning();
//             }}
//             className={`pb-3.5 pt-2 px-4 font-body text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 flex items-center gap-2 ${
//               activeTab === 'approve'
//                 ? 'border-amber-500 text-bone-100'
//                 : 'border-transparent text-bone-500 hover:text-bone-300'
//             }`}
//           >
//             Approve Payments
//             {pendingOrders.length > 0 && (
//               <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
//                 {pendingOrders.length}
//               </span>
//             )}
//           </button>
//         </div>

//         {/* Live dashboard stats */}
//         {stats && (
//           <div className="mt-6 grid grid-cols-3 gap-3">
//             <StatCard label="Checked in" value={stats.checkedIn} accent="coral" />
//             <StatCard label="Remaining" value={stats.remaining} accent="amber" />
//             <StatCard label="Total tickets" value={stats.totalTickets} />
//           </div>
//         )}

//         {/* Tab 1 content: Ticket Validator */}
//         {activeTab === 'validate' && (
//           <div className="mt-6 space-y-5 animate-rise" style={{ animationDuration: '0.4s' }}>
//             <div className="card overflow-hidden">
//               <div className="relative aspect-square w-full bg-ink-950 sm:aspect-video">
//                 <video
//                   ref={videoRef}
//                   className={`h-full w-full object-cover ${scanning ? 'block' : 'hidden'}`}
//                   playsInline
//                   muted
//                 />
//                 {!scanning && (
//                   <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
//                     <p className="font-mono text-sm text-bone-500">
//                       Camera is off
//                     </p>
//                     <button
//                       onClick={startScanning}
//                       className="btn-primary"
//                     >
//                       Start camera
//                     </button>
//                   </div>
//                 )}
//                 {scanning && (
//                   <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
//                     <div className="h-2/3 w-2/3 rounded-2xl border-2 border-coral-400/70" />
//                   </div>
//                 )}
//               </div>

//               {scanning && (
//                 <button
//                   onClick={stopScanning}
//                   className="w-full border-t border-bone-100/10 py-3 font-mono text-xs text-bone-500 hover:text-bone-300"
//                 >
//                   Stop camera
//                 </button>
//               )}

//               {cameraError && (
//                 <p className="border-t border-bone-100/10 px-5 py-3 text-center font-body text-sm text-coral-400">
//                   {cameraError}
//                 </p>
//               )}
//             </div>

//             {/* Manual check form */}
//             <form onSubmit={handleManualSubmit} className="card flex gap-2 p-4">
//               <input
//                 type="text"
//                 value={manualId}
//                 onChange={(e) => setManualId(e.target.value)}
//                 placeholder="Or enter ticket ID manually"
//                 className="input-field flex-1"
//               />
//               <button type="submit" className="btn-secondary">Check</button>
//             </form>

//             {/* Result scan display */}
//             {result && <ResultCard result={result} onNext={() => setResult(null)} />}
//           </div>
//         )}

//         {/* Tab 2 content: UPI approvals queue */}
//         {activeTab === 'approve' && (
//           <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
//             <PendingApprovalsSection
//               orders={pendingOrders}
//               loading={loadingPending}
//               error={pendingError}
//               fetchPending={fetchPending}
//               refreshStats={refreshStats}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function PendingApprovalsSection({ orders, loading, error, fetchPending, refreshStats }) {
//   const [actionLoading, setActionLoading] = useState(null);

//   async function handleApprove(orderId) {
//     if (!window.confirm('Are you sure you want to approve this payment? This will generate tickets and send them via email.')) return;
//     setActionLoading(orderId);
//     try {
//       await approveUpiOrder(orderId);
//       fetchPending();
//       refreshStats();
//     } catch (err) {
//       alert(err instanceof ApiError ? err.message : 'Approval failed.');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   async function handleReject(orderId) {
//     if (!window.confirm('Are you sure you want to reject this payment? This will mark the order as failed.')) return;
//     setActionLoading(orderId);
//     try {
//       await rejectUpiOrder(orderId);
//       fetchPending();
//       refreshStats();
//     } catch (err) {
//       alert(err instanceof ApiError ? err.message : 'Rejection failed.');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   return (
//     <div className="space-y-4">
//       <div>
//         <p className="label-eyebrow">Verification Queue</p>
//         <h2 className="font-display text-2xl uppercase text-bone-100">UPI Payment Approvals</h2>
//       </div>

//       {error && (
//         <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400 border border-coral-500/20">
//           {error}
//         </p>
//       )}

//       {loading && orders.length === 0 ? (
//         <div className="card p-6 text-center text-bone-500 font-mono text-xs animate-pulse">
//           Loading pending queue…
//         </div>
//       ) : orders.length === 0 ? (
//         <div className="card p-6 text-center text-bone-500 font-mono text-xs">
//           No pending UPI approvals found.
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {orders.map((o) => (
//             <div key={o.orderId} className="card p-5 space-y-4 border-bone-100/10">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <h3 className="font-body font-bold text-bone-100 text-sm">{o.name}</h3>
//                   <p className="font-mono text-xs text-bone-500 mt-0.5">{o.email} &middot; {o.phone}</p>
//                 </div>
//                 <div className="text-right">
//                   <span className="font-display text-lg text-amber-400 font-bold">₹{o.totalAmount.toLocaleString('en-IN')}</span>
//                   <p className="font-mono text-[10px] text-bone-500 mt-0.5">{o.quantity} &times; {o.ticketType}</p>
//                 </div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ink-950/40 rounded-xl p-3 border border-bone-100/5">
//                 <div className="font-mono text-xs">
//                   <span className="text-bone-500 uppercase tracking-wider block text-[9px] mb-0.5">UTR / Txn ID</span>
//                   <span className="text-bone-200 font-bold text-sm tracking-wide">{o.upiTransactionId}</span>
//                 </div>
//                 <div className="font-mono text-xs text-right sm:text-left">
//                   <span className="text-bone-500 uppercase tracking-wider block text-[9px] mb-0.5">Billing ID</span>
//                   <span className="text-bone-300 font-medium">{o.orderId}</span>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <button
//                   type="button"
//                   disabled={actionLoading !== null}
//                   onClick={() => handleApprove(o.orderId)}
//                   className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-ink-950 font-body font-bold text-xs py-2 px-3 transition-colors disabled:opacity-50"
//                 >
//                   {actionLoading === o.orderId ? 'Processing…' : 'Approve & Issue Ticket'}
//                 </button>
//                 <button
//                   type="button"
//                   disabled={actionLoading !== null}
//                   onClick={() => handleReject(o.orderId)}
//                   className="inline-flex items-center justify-center rounded-lg border border-coral-500/30 text-coral-400 hover:border-coral-500 hover:bg-coral-500/10 font-body font-semibold text-xs py-2 px-3 transition-colors disabled:opacity-50"
//                 >
//                   Reject
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function ResultCard({ result, onNext }) {
//   if (result.valid) {
//     return (
//       <div className="card mt-5 border-amber-500/30 bg-amber-500/[0.06] p-6 text-center">
//         <p className="text-3xl">✅</p>
//         <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">Entry granted</h2>
//         <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
//         <p className="font-body text-sm text-bone-400">{result.ticketType} Ticket</p>
//         <p className="mt-1 font-mono text-xs text-amber-400">
//           Ticket {result.ticketNumber} of {result.totalInOrder}
//         </p>
//         <p className="mt-1 font-mono text-xs text-bone-600">Checked in at {result.checkedInAt}</p>
//         <button onClick={onNext} className="btn-primary mt-5 w-full">
//           Next person
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="card mt-5 border-coral-500/30 bg-coral-500/[0.06] p-6 text-center">
//       <p className="text-3xl">❌</p>
//       <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">
//         {result.code === 'ALREADY_USED' ? 'Already checked in' : 'Entry denied'}
//       </h2>
//       {result.attendeeName && (
//         <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
//       )}
//       {result.ticketNumber && (
//         <p className="font-mono text-xs text-coral-400">
//           Ticket {result.ticketNumber} of {result.totalInOrder}
//         </p>
//       )}
//       <p className="mt-2 font-body text-sm text-bone-400">{result.reason}</p>
//       {result.usedAt && (
//         <p className="mt-1 font-mono text-xs text-bone-600">
//           Was checked in at {new Date(result.usedAt).toLocaleTimeString('en-IN')}
//         </p>
//       )}
//       <button onClick={onNext} className="btn-secondary mt-5 w-full">
//         Try again
//       </button>
//     </div>
//   );
// }




// import { useEffect, useRef, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import StatCard from '../../components/StatCard.jsx';
// import { validateTicket, getAdminStats, getPendingUpiOrders, getAllTickets, approveUpiOrder, rejectUpiOrder, ApiError } from '../../lib/api.js';
// import jsQR from 'jsqr';

// export default function AdminScanner() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const rafRef = useRef(null);
//   const canvasRef = useRef(document.createElement('canvas'));
//   const lastScanRef = useRef('');

//   const [activeTab, setActiveTab] = useState('validate');
//   const [stats, setStats] = useState(null);
//   const [result, setResult] = useState(null);
//   const [manualId, setManualId] = useState('');
//   const [scanning, setScanning] = useState(false);
//   const [cameraError, setCameraError] = useState('');

//   const [pendingOrders, setPendingOrders] = useState([]);
//   const [loadingPending, setLoadingPending] = useState(false);
//   const [pendingError, setPendingError] = useState('');

//   useEffect(() => {
//     if (sessionStorage.getItem('admin_authed') !== 'true') {
//       navigate('/admin');
//     }
//   }, [navigate]);

//   const refreshStats = useCallback(() => {
//     getAdminStats().then(setStats).catch(() => {});
//   }, []);

//   const fetchPending = useCallback(() => {
//     setLoadingPending(true);
//     getPendingUpiOrders()
//       .then((res) => {
//         if (res.success) setPendingOrders(res.orders || []);
//       })
//       .catch((err) => {
//         setPendingError(err instanceof ApiError ? err.message : 'Could not fetch pending payments.');
//       })
//       .finally(() => setLoadingPending(false));
//   }, []);

//   useEffect(() => {
//     refreshStats();
//     fetchPending();
//     const id = setInterval(() => {
//       refreshStats();
//       fetchPending();
//     }, 15000);
//     return () => clearInterval(id);
//   }, [refreshStats, fetchPending]);

//   async function startScanning() {
//     setCameraError('');
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       setCameraError(
//         window.isSecureContext === false
//           ? 'Camera requires HTTPS. Please access via HTTPS or localhost.'
//           : 'Camera API not supported by this browser.'
//       );
//       return;
//     }
//     try {
//       let stream;
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
//       } catch {
//         stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       }
//       streamRef.current = stream;
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//       setScanning(true);
//       tick();
//     } catch {
//       setCameraError('Could not access camera. Check permissions or use manual entry below.');
//     }
//   }

//   function stopScanning() {
//     setScanning(false);
//     if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//   }

//   function tick() {
//     if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
//       rafRef.current = requestAnimationFrame(tick);
//       return;
//     }
//     const canvas = canvasRef.current;
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
//     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     if (jsQR) {
//       const code = jsQR(imageData.data, imageData.width, imageData.height);
//       if (code && code.data && code.data !== lastScanRef.current) {
//         lastScanRef.current = code.data;
//         handleScan(code.data);
//         setTimeout(() => { lastScanRef.current = ''; }, 2000);
//       }
//     }
//     rafRef.current = requestAnimationFrame(tick);
//   }

//   useEffect(() => () => stopScanning(), []);

//   async function handleScan(ticketId) {
//     try {
//       const res = await validateTicket(ticketId, 'Gate Scanner');
//       setResult(res);
//       refreshStats();
//     } catch (err) {
//       setResult({
//         valid: false,
//         code: 'ERROR',
//         reason: err instanceof ApiError ? err.message : 'Could not validate ticket.',
//       });
//     }
//   }

//   function handleManualSubmit(e) {
//     e.preventDefault();
//     if (!manualId.trim()) return;
//     handleScan(manualId.trim());
//     setManualId('');
//   }

//   return (
//     <div className="min-h-screen px-5 py-10 sm:px-8">
//       <div className="mx-auto max-w-3xl">

//         {/* Header */}
//         <div className="flex items-center justify-between border-b border-bone-100/10 pb-5">
//           <div>
//             <p className="label-eyebrow">Gate control</p>
//             <h1 className="font-display text-3xl uppercase text-bone-100">Admin Dashboard</h1>
//           </div>
//           <button
//             onClick={() => { sessionStorage.removeItem('admin_authed'); navigate('/admin'); }}
//             className="font-mono text-xs text-bone-600 hover:text-bone-400"
//           >
//             Sign out
//           </button>
//         </div>

//         {/* Tab switcher */}
//         <div className="mt-6 flex gap-1 overflow-x-auto border-b border-bone-100/10">
//           <TabButton label="Validate Tickets" active={activeTab === 'validate'} color="coral"
//             onClick={() => { setActiveTab('validate'); stopScanning(); }} />
//           <TabButton
//             label="Approve Payments" active={activeTab === 'approve'} color="amber"
//             badge={pendingOrders.length > 0 ? pendingOrders.length : null}
//             onClick={() => { setActiveTab('approve'); stopScanning(); }}
//           />
//           <TabButton label="Sent Tickets" active={activeTab === 'sent'} color="bone"
//             onClick={() => { setActiveTab('sent'); stopScanning(); }} />
//         </div>

//         {/* Stats */}
//         {stats && (
//           <div className="mt-6 grid grid-cols-3 gap-3">
//             <StatCard label="Checked in" value={stats.checkedIn} accent="coral" />
//             <StatCard label="Remaining" value={stats.remaining} accent="amber" />
//             <StatCard label="Total tickets" value={stats.totalTickets} />
//           </div>
//         )}

//         {/* Tab 1: Validate */}
//         {activeTab === 'validate' && (
//           <div className="mt-6 space-y-5 animate-rise" style={{ animationDuration: '0.4s' }}>
//             <div className="card overflow-hidden">
//               <div className="relative aspect-square w-full bg-ink-950 sm:aspect-video">
//                 <video
//                   ref={videoRef}
//                   className={`h-full w-full object-cover ${scanning ? 'block' : 'hidden'}`}
//                   playsInline muted
//                 />
//                 {!scanning && (
//                   <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
//                     <p className="font-mono text-sm text-bone-500">Camera is off</p>
//                     <button onClick={startScanning} className="btn-primary">Start camera</button>
//                   </div>
//                 )}
//                 {scanning && (
//                   <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
//                     <div className="h-2/3 w-2/3 rounded-2xl border-2 border-coral-400/70" />
//                   </div>
//                 )}
//               </div>
//               {scanning && (
//                 <button onClick={stopScanning}
//                   className="w-full border-t border-bone-100/10 py-3 font-mono text-xs text-bone-500 hover:text-bone-300">
//                   Stop camera
//                 </button>
//               )}
//               {cameraError && (
//                 <p className="border-t border-bone-100/10 px-5 py-3 text-center font-body text-sm text-coral-400">
//                   {cameraError}
//                 </p>
//               )}
//             </div>

//             <form onSubmit={handleManualSubmit} className="card flex gap-2 p-4">
//               <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)}
//                 placeholder="Or enter ticket ID manually" className="input-field flex-1" />
//               <button type="submit" className="btn-secondary">Check</button>
//             </form>

//             {result && <ResultCard result={result} onNext={() => setResult(null)} />}
//           </div>
//         )}

//         {/* Tab 2: Approve Payments */}
//         {activeTab === 'approve' && (
//           <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
//             <PendingApprovalsSection
//               orders={pendingOrders}
//               loading={loadingPending}
//               error={pendingError}
//               fetchPending={fetchPending}
//               refreshStats={refreshStats}
//             />
//           </div>
//         )}

//         {/* Tab 3: Sent Tickets */}
//         {activeTab === 'sent' && (
//           <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
//             <SentTicketsSection />
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// // ── Sent Tickets Section ──────────────────────────────────────────────────────
// function SentTicketsSection() {
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState('all'); // all | used | unused
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState(null);

//   const fetchTickets = useCallback(async (p = 1, s = search, f = filter) => {
//     setLoading(true);
//     setError('');
//     try {
//       const params = { page: p, limit: 20 };
//       if (s.trim()) params.search = s.trim();
//       if (f === 'used') params.used = 'true';
//       if (f === 'unused') params.used = 'false';
//       const res = await getAllTickets(params);
//       setTickets(res.tickets || []);
//       setPagination(res.pagination || null);
//       setPage(p);
//     } catch (err) {
//       setError(err instanceof ApiError ? err.message : 'Could not load tickets.');
//     } finally {
//       setLoading(false);
//     }
//   }, [search, filter]);

//   useEffect(() => { fetchTickets(1, search, filter); }, []);

//   function handleSearch(e) {
//     e.preventDefault();
//     fetchTickets(1, search, filter);
//   }

//   function handleFilter(f) {
//     setFilter(f);
//     fetchTickets(1, search, f);
//   }

//   return (
//     <div className="space-y-4">
//       <div>
//         <p className="label-eyebrow">All issued tickets</p>
//         <h2 className="font-display text-2xl uppercase text-bone-100">Sent Tickets</h2>
//       </div>

//       {/* Search + filter bar */}
//       <form onSubmit={handleSearch} className="flex gap-2">
//         <input
//           type="text"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search name, email or ticket ID…"
//           className="input-field flex-1"
//         />
//         <button type="submit" className="btn-secondary shrink-0">Search</button>
//       </form>

//       <div className="flex gap-2">
//         {['all', 'used', 'unused'].map((f) => (
//           <button
//             key={f}
//             onClick={() => handleFilter(f)}
//             className={`rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors
//               ${filter === f
//                 ? 'bg-coral-500 text-ink-950'
//                 : 'border border-bone-100/20 text-bone-500 hover:border-bone-100/40 hover:text-bone-300'}`}
//           >
//             {f === 'all' ? 'All' : f === 'used' ? 'Checked in' : 'Not yet scanned'}
//           </button>
//         ))}
//       </div>

//       {error && (
//         <p className="rounded-lg border border-coral-500/20 bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
//           {error}
//         </p>
//       )}

//       {loading ? (
//         <div className="card p-6 text-center font-mono text-xs text-bone-500 animate-pulse">
//           Loading tickets…
//         </div>
//       ) : tickets.length === 0 ? (
//         <div className="card p-6 text-center font-mono text-xs text-bone-500">
//           No tickets found.
//         </div>
//       ) : (
//         <div className="space-y-2">
//           {tickets.map((t) => (
//             <div key={t.ticketId}
//               className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">

//               {/* Left: name + email */}
//               <div className="min-w-0">
//                 <div className="flex items-center gap-2">
//                   <p className="font-body font-semibold text-bone-100 truncate">{t.name}</p>
//                   <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase
//                     ${t.ticketType === 'VIP' ? 'bg-amber-500/20 text-amber-400' : 'bg-coral-500/20 text-coral-400'}`}>
//                     {t.ticketType}
//                   </span>
//                 </div>
//                 <p className="mt-0.5 font-mono text-xs text-bone-500 truncate">{t.email}</p>
//                 <p className="mt-0.5 font-mono text-[11px] text-bone-600 truncate">{t.ticketId}</p>
//               </div>

//               {/* Right: status + ticket number */}
//               <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
//                 <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider
//                   ${t.used
//                     ? 'bg-emerald-500/15 text-emerald-400'
//                     : 'bg-bone-100/10 text-bone-400'}`}>
//                   {t.used ? '✓ Checked in' : 'Not scanned'}
//                 </span>
//                 <p className="font-mono text-[11px] text-bone-600">
//                   Ticket {t.ticketNumber} of {t.totalInOrder}
//                 </p>
//                 {t.used && t.usedAt && (
//                   <p className="font-mono text-[10px] text-bone-600">
//                     {new Date(t.usedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {pagination && pagination.pages > 1 && (
//         <div className="flex items-center justify-between pt-2">
//           <button
//             onClick={() => fetchTickets(page - 1)}
//             disabled={page <= 1}
//             className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
//           >
//             ← Prev
//           </button>
//           <p className="font-mono text-xs text-bone-500">
//             Page {page} of {pagination.pages} &middot; {pagination.total} tickets
//           </p>
//           <button
//             onClick={() => fetchTickets(page + 1)}
//             disabled={page >= pagination.pages}
//             className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
//           >
//             Next →
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Tab Button ────────────────────────────────────────────────────────────────
// function TabButton({ label, active, color, badge, onClick }) {
//   const activeColors = {
//     coral: 'border-coral-500 text-bone-100',
//     amber: 'border-amber-500 text-bone-100',
//     bone: 'border-bone-200 text-bone-100',
//   };
//   return (
//     <button
//       onClick={onClick}
//       className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-3.5 pt-2
//         font-body text-sm font-semibold tracking-wide transition-all duration-200
//         ${active ? activeColors[color] : 'border-transparent text-bone-500 hover:text-bone-300'}`}
//     >
//       {label}
//       {badge && (
//         <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
//           {badge}
//         </span>
//       )}
//     </button>
//   );
// }

// // ── Pending Approvals ─────────────────────────────────────────────────────────
// function PendingApprovalsSection({ orders, loading, error, fetchPending, refreshStats }) {
//   const [actionLoading, setActionLoading] = useState(null);

//   async function handleApprove(orderId) {
//     if (!window.confirm('Approve this payment? Tickets will be generated and emailed.')) return;
//     setActionLoading(orderId);
//     try {
//       await approveUpiOrder(orderId);
//       fetchPending();
//       refreshStats();
//     } catch (err) {
//       alert(err instanceof ApiError ? err.message : 'Approval failed.');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   async function handleReject(orderId) {
//     if (!window.confirm('Reject this payment? The order will be marked as failed.')) return;
//     setActionLoading(orderId);
//     try {
//       await rejectUpiOrder(orderId);
//       fetchPending();
//       refreshStats();
//     } catch (err) {
//       alert(err instanceof ApiError ? err.message : 'Rejection failed.');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   return (
//     <div className="space-y-4">
//       <div>
//         <p className="label-eyebrow">Verification Queue</p>
//         <h2 className="font-display text-2xl uppercase text-bone-100">UPI Payment Approvals</h2>
//       </div>

//       {error && (
//         <p className="rounded-lg border border-coral-500/20 bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
//           {error}
//         </p>
//       )}

//       {loading && orders.length === 0 ? (
//         <div className="card p-6 text-center font-mono text-xs text-bone-500 animate-pulse">
//           Loading pending queue…
//         </div>
//       ) : orders.length === 0 ? (
//         <div className="card p-6 text-center font-mono text-xs text-bone-500">
//           No pending UPI approvals found.
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {orders.map((o) => (
//             <div key={o.orderId} className="card space-y-4 border-bone-100/10 p-5">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <h3 className="font-body text-sm font-bold text-bone-100">{o.name}</h3>
//                   <p className="mt-0.5 font-mono text-xs text-bone-500">{o.email} &middot; {o.phone}</p>
//                 </div>
//                 <div className="text-right">
//                   <span className="font-display text-lg font-bold text-amber-400">
//                     ₹{o.totalAmount.toLocaleString('en-IN')}
//                   </span>
//                   <p className="mt-0.5 font-mono text-[10px] text-bone-500">
//                     {o.quantity} &times; {o.ticketType}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-bone-100/5 bg-ink-950/40 p-3 sm:flex-row sm:items-center">
//                 <div className="font-mono text-xs">
//                   <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-bone-500">UTR / Txn ID</span>
//                   <span className="text-sm font-bold tracking-wide text-bone-200">{o.upiTransactionId}</span>
//                 </div>
//                 <div className="font-mono text-xs sm:text-right">
//                   <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-bone-500">Order ID</span>
//                   <span className="font-medium text-bone-300">{o.orderId}</span>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <button type="button" disabled={actionLoading !== null} onClick={() => handleApprove(o.orderId)}
//                   className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-body text-xs font-bold text-ink-950 transition-colors hover:bg-emerald-500 disabled:opacity-50">
//                   {actionLoading === o.orderId ? 'Processing…' : 'Approve & Issue Ticket'}
//                 </button>
//                 <button type="button" disabled={actionLoading !== null} onClick={() => handleReject(o.orderId)}
//                   className="inline-flex items-center justify-center rounded-lg border border-coral-500/30 px-3 py-2 font-body text-xs font-semibold text-coral-400 transition-colors hover:border-coral-500 hover:bg-coral-500/10 disabled:opacity-50">
//                   Reject
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Result Card ───────────────────────────────────────────────────────────────
// function ResultCard({ result, onNext }) {
//   if (result.valid) {
//     return (
//       <div className="card mt-5 border-amber-500/30 bg-amber-500/[0.06] p-6 text-center">
//         <p className="text-3xl">✅</p>
//         <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">Entry granted</h2>
//         <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
//         <p className="font-body text-sm text-bone-400">{result.ticketType} Ticket</p>
//         <p className="mt-1 font-mono text-xs text-amber-400">
//           Ticket {result.ticketNumber} of {result.totalInOrder}
//         </p>
//         <p className="mt-1 font-mono text-xs text-bone-600">Checked in at {result.checkedInAt}</p>
//         <button onClick={onNext} className="btn-primary mt-5 w-full">Next person</button>
//       </div>
//     );
//   }

//   return (
//     <div className="card mt-5 border-coral-500/30 bg-coral-500/[0.06] p-6 text-center">
//       <p className="text-3xl">❌</p>
//       <h2 className="mt-2 font-display text-2xl uppercase text-bone-100">
//         {result.code === 'ALREADY_USED' ? 'Already checked in' : 'Entry denied'}
//       </h2>
//       {result.attendeeName && (
//         <p className="mt-3 font-body font-medium text-bone-100">{result.attendeeName}</p>
//       )}
//       {result.ticketNumber && (
//         <p className="font-mono text-xs text-coral-400">
//           Ticket {result.ticketNumber} of {result.totalInOrder}
//         </p>
//       )}
//       <p className="mt-2 font-body text-sm text-bone-400">{result.reason}</p>
//       {result.usedAt && (
//         <p className="mt-1 font-mono text-xs text-bone-600">
//           Was checked in at {new Date(result.usedAt).toLocaleTimeString('en-IN')}
//         </p>
//       )}
//       <button onClick={onNext} className="btn-secondary mt-5 w-full">Try again</button>
//     </div>
//   );
// }




// new version 




import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard.jsx';
import { validateTicket, getAdminStats, getPendingUpiOrders, getAllTickets, approveUpiOrder, rejectUpiOrder, ApiError } from '../../lib/api.js';
import jsQR from 'jsqr';

// ── Ticket pricing (frontend-only, from env) ───────────────────────────────────
const TICKET_PRICES = {
  general: Number(import.meta.env.VITE_PRICE_GENERAL) || 0,
  vip: Number(import.meta.env.VITE_PRICE_VIP) || 0,
};

function getTicketPrice(ticketType) {
  return TICKET_PRICES[(ticketType || '').toLowerCase()] ?? 0;
}

export default function AdminScanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const lastScanRef = useRef('');

  const [activeTab, setActiveTab] = useState('validate');
  const [stats, setStats] = useState(null);
  const [result, setResult] = useState(null);
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const refreshStats = useCallback(() => {
    getAdminStats().then(setStats).catch(() => { });
  }, []);

  const fetchPending = useCallback(() => {
    setLoadingPending(true);
    getPendingUpiOrders()
      .then((res) => {
        if (res.success) setPendingOrders(res.orders || []);
      })
      .catch((err) => {
        setPendingError(err instanceof ApiError ? err.message : 'Could not fetch pending payments.');
      })
      .finally(() => setLoadingPending(false));
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

  async function startScanning() {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        window.isSecureContext === false
          ? 'Camera requires HTTPS. Please access via HTTPS or localhost.'
          : 'Camera API not supported by this browser.'
      );
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      tick();
    } catch {
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
    if (jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
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
            onClick={() => { sessionStorage.removeItem('admin_authed'); navigate('/admin'); }}
            className="font-mono text-xs text-bone-600 hover:text-bone-400"
          >
            Sign out
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-bone-100/10">
          <TabButton label="Validate Tickets" active={activeTab === 'validate'} color="coral"
            onClick={() => { setActiveTab('validate'); stopScanning(); }} />
          <TabButton
            label="Approve Payments" active={activeTab === 'approve'} color="amber"
            badge={pendingOrders.length > 0 ? pendingOrders.length : null}
            onClick={() => { setActiveTab('approve'); stopScanning(); }}
          />
          <TabButton label="Sent Tickets" active={activeTab === 'sent'} color="bone"
            onClick={() => { setActiveTab('sent'); stopScanning(); }} />
          <TabButton label="Revenue" active={activeTab === 'revenue'} color="amber"
            onClick={() => { setActiveTab('revenue'); stopScanning(); }} />
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Checked in" value={stats.checkedIn} accent="coral" />
            <StatCard label="Remaining" value={stats.remaining} accent="amber" />
            <StatCard label="Total tickets" value={stats.totalTickets} />
          </div>
        )}

        {/* Tab 1: Validate */}
        {activeTab === 'validate' && (
          <div className="mt-6 space-y-5 animate-rise" style={{ animationDuration: '0.4s' }}>
            <div className="card overflow-hidden">
              <div className="relative aspect-square w-full bg-ink-950 sm:aspect-video">
                <video
                  ref={videoRef}
                  className={`h-full w-full object-cover ${scanning ? 'block' : 'hidden'}`}
                  playsInline muted
                />
                {!scanning && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="font-mono text-sm text-bone-500">Camera is off</p>
                    <button onClick={startScanning} className="btn-primary">Start camera</button>
                  </div>
                )}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-2/3 w-2/3 rounded-2xl border-2 border-coral-400/70" />
                  </div>
                )}
              </div>
              {scanning && (
                <button onClick={stopScanning}
                  className="w-full border-t border-bone-100/10 py-3 font-mono text-xs text-bone-500 hover:text-bone-300">
                  Stop camera
                </button>
              )}
              {cameraError && (
                <p className="border-t border-bone-100/10 px-5 py-3 text-center font-body text-sm text-coral-400">
                  {cameraError}
                </p>
              )}
            </div>

            <form onSubmit={handleManualSubmit} className="card flex gap-2 p-4">
              <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)}
                placeholder="Or enter ticket ID manually" className="input-field flex-1" />
              <button type="submit" className="btn-secondary">Check</button>
            </form>

            {result && <ResultCard result={result} onNext={() => setResult(null)} />}
          </div>
        )}

        {/* Tab 2: Approve Payments */}
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

        {/* Tab 3: Sent Tickets */}
        {activeTab === 'sent' && (
          <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
            <SentTicketsSection />
          </div>
        )}

        {/* Tab 4: Revenue */}
        {activeTab === 'revenue' && (
          <div className="mt-6 animate-rise" style={{ animationDuration: '0.4s' }}>
            <RevenueSection />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Revenue Section ─────────────────────────────────────────────────────────
function RevenueSection() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ tickets: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let page = 1;
      let all = [];
      let pages = 1;
      do {
        const res = await getAllTickets({ page, limit: 100 });
        all = all.concat(res.tickets || []);
        pages = res.pagination?.pages || 1;
        page += 1;
      } while (page <= pages);

      const byUser = new Map();
      let totalRevenue = 0;

      for (const t of all) {
        const price = getTicketPrice(t.ticketType);
        totalRevenue += price;

        const key = t.email || t.name;
        if (!byUser.has(key)) {
          byUser.set(key, { name: t.name, email: t.email, tickets: 0, amount: 0 });
        }
        const entry = byUser.get(key);
        entry.tickets += 1;
        entry.amount += price;
      }

      const grouped = Array.from(byUser.values()).sort((a, b) => b.amount - a.amount);

      setRows(grouped);
      setTotals({ tickets: all.length, revenue: totalRevenue });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load revenue data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-eyebrow">Revenue overview</p>
          <h2 className="font-display text-2xl uppercase text-bone-100">Revenue by Attendee</h2>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="font-mono text-xs text-bone-500 hover:text-bone-300 disabled:opacity-40"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total tickets sold" value={totals.tickets} />
        <StatCard
          label="Total revenue"
          value={`₹${totals.revenue.toLocaleString('en-IN')}`}
          accent="amber"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-coral-500/20 bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500 animate-pulse">
          Crunching numbers…
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500">
          No ticket data found.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-bone-100/10 font-mono text-[10px] uppercase tracking-wider text-bone-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Tickets</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email || r.name} className="border-b border-bone-100/5 last:border-0">
                  <td className="px-4 py-3 font-body text-sm text-bone-100">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-bone-500">{r.email}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-bone-300">{r.tickets}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-amber-400">
                    ₹{r.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-bone-100/10 font-mono text-xs">
                <td className="px-4 py-3 font-bold text-bone-100" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right font-bold text-bone-100">{totals.tickets}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-400">
                  ₹{totals.revenue.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sent Tickets Section ──────────────────────────────────────────────────────
function SentTicketsSection() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | used | unused
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchTickets = useCallback(async (p = 1, s = search, f = filter) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: 20 };
      if (s.trim()) params.search = s.trim();
      if (f === 'used') params.used = 'true';
      if (f === 'unused') params.used = 'false';
      const res = await getAllTickets(params);
      setTickets(res.tickets || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchTickets(1, search, filter); }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchTickets(1, search, filter);
  }

  function handleFilter(f) {
    setFilter(f);
    fetchTickets(1, search, f);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label-eyebrow">All issued tickets</p>
        <h2 className="font-display text-2xl uppercase text-bone-100">Sent Tickets</h2>
      </div>

      {/* Search + filter bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or ticket ID…"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-secondary shrink-0">Search</button>
      </form>

      <div className="flex gap-2">
        {['all', 'used', 'unused'].map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors
              ${filter === f
                ? 'bg-coral-500 text-ink-950'
                : 'border border-bone-100/20 text-bone-500 hover:border-bone-100/40 hover:text-bone-300'}`}
          >
            {f === 'all' ? 'All' : f === 'used' ? 'Checked in' : 'Not yet scanned'}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-coral-500/20 bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500 animate-pulse">
          Loading tickets…
        </div>
      ) : tickets.length === 0 ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.ticketId}
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">

              {/* Left: name + email */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body font-semibold text-bone-100 truncate">{t.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase
                    ${t.ticketType === 'VIP' ? 'bg-amber-500/20 text-amber-400' : 'bg-coral-500/20 text-coral-400'}`}>
                    {t.ticketType}
                  </span>
                </div>
                {/* <p className="mt-0.5 font-mono text-xs text-bone-500 truncate">{t.email}</p>
                <p className="mt-0.5 font-mono text-[11px] text-bone-600 truncate">{t.ticketId}</p> */}

                <p className="mt-0.5 truncate font-mono text-xs text-bone-500">{t.email}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="truncate font-mono text-[11px] text-bone-600">{t.ticketId}</p>
                  <span className="shrink-0 font-mono text-[11px] font-bold text-amber-400">
                    ₹{(getTicketPrice(t.ticketType) * t.totalInOrder).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Right: status + ticket number */}
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider
                  ${t.used
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-bone-100/10 text-bone-400'}`}>
                  {t.used ? '✓ Checked in' : 'Not scanned'}
                </span>
                <p className="font-mono text-[11px] text-bone-600">
                  Ticket {t.ticketNumber} of {t.totalInOrder}
                </p>
                {t.used && t.usedAt && (
                  <p className="font-mono text-[10px] text-bone-600">
                    {new Date(t.usedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => fetchTickets(page - 1)}
            disabled={page <= 1}
            className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
          >
            ← Prev
          </button>
          <p className="font-mono text-xs text-bone-500">
            Page {page} of {pagination.pages} &middot; {pagination.total} tickets
          </p>
          <button
            onClick={() => fetchTickets(page + 1)}
            disabled={page >= pagination.pages}
            className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabButton({ label, active, color, badge, onClick }) {
  const activeColors = {
    coral: 'border-coral-500 text-bone-100',
    amber: 'border-amber-500 text-bone-100',
    bone: 'border-bone-200 text-bone-100',
  };
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-3.5 pt-2
        font-body text-sm font-semibold tracking-wide transition-all duration-200
        ${active ? activeColors[color] : 'border-transparent text-bone-500 hover:text-bone-300'}`}
    >
      {label}
      {badge && (
        <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Pending Approvals ─────────────────────────────────────────────────────────
function PendingApprovalsSection({ orders, loading, error, fetchPending, refreshStats }) {
  const [actionLoading, setActionLoading] = useState(null);

  async function handleApprove(orderId) {
    if (!window.confirm('Approve this payment? Tickets will be generated and emailed.')) return;
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
    if (!window.confirm('Reject this payment? The order will be marked as failed.')) return;
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
        <p className="rounded-lg border border-coral-500/20 bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
          {error}
        </p>
      )}

      {loading && orders.length === 0 ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500 animate-pulse">
          Loading pending queue…
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-6 text-center font-mono text-xs text-bone-500">
          No pending UPI approvals found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.orderId} className="card space-y-4 border-bone-100/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-body text-sm font-bold text-bone-100">{o.name}</h3>
                  <p className="mt-0.5 font-mono text-xs text-bone-500">{o.email} &middot; {o.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-lg font-bold text-amber-400">
                    ₹{o.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <p className="mt-0.5 font-mono text-[10px] text-bone-500">
                    {o.quantity} &times; {o.ticketType}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-bone-100/5 bg-ink-950/40 p-3 sm:flex-row sm:items-center">
                <div className="font-mono text-xs">
                  <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-bone-500">UTR / Txn ID</span>
                  <span className="text-sm font-bold tracking-wide text-bone-200">{o.upiTransactionId}</span>
                </div>
                <div className="font-mono text-xs sm:text-right">
                  <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-bone-500">Order ID</span>
                  <span className="font-medium text-bone-300">{o.orderId}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" disabled={actionLoading !== null} onClick={() => handleApprove(o.orderId)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-body text-xs font-bold text-ink-950 transition-colors hover:bg-emerald-500 disabled:opacity-50">
                  {actionLoading === o.orderId ? 'Processing…' : 'Approve & Issue Ticket'}
                </button>
                <button type="button" disabled={actionLoading !== null} onClick={() => handleReject(o.orderId)}
                  className="inline-flex items-center justify-center rounded-lg border border-coral-500/30 px-3 py-2 font-body text-xs font-semibold text-coral-400 transition-colors hover:border-coral-500 hover:bg-coral-500/10 disabled:opacity-50">
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

// ── Result Card ───────────────────────────────────────────────────────────────
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
        <button onClick={onNext} className="btn-primary mt-5 w-full">Next person</button>
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
      <button onClick={onNext} className="btn-secondary mt-5 w-full">Try again</button>
    </div>
  );
}