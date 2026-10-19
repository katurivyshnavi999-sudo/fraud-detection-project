import { INDIAN_STATES_DISTRICTS } from '../data/indianGeographies';
import { transactionsAPI } from './api';

const STATES = Object.keys(INDIAN_STATES_DISTRICTS).filter(s => s !== 'Other / Unknown');

const MERCHANTS = [
  { id: 'M001', name: 'Kirana Mart Central', category: 'Grocery & Daily Retail', riskBase: 12 },
  { id: 'MERCH_101', name: 'Reliance Smart Superstore', category: 'Grocery & Daily Retail', riskBase: 10 },
  { id: 'MERCH_202', name: 'Swiggy Food Delivery', category: 'Food & Dining', riskBase: 8 },
  { id: 'MERCH_303', name: 'Croma Digital Electronics', category: 'Electronics & Digital Goods', riskBase: 25 },
  { id: 'MERCH_404', name: 'Taj Gateway Hospitality', category: 'Travel & Transportation', riskBase: 15 },
  { id: 'MERCH_505', name: 'Shell Express Fuel', category: 'Utility Bills & Telecom', riskBase: 14 },
  { id: 'MERCH_606', name: 'Flipkart Online Commerce', category: 'Electronics & Digital Goods', riskBase: 18 },
  { id: 'MERCH_707', name: 'Apollo 24/7 Pharmacy', category: 'Healthcare & Pharmacy', riskBase: 9 },
  { id: 'MERCH_808', name: 'BookMyShow Entertainment', category: 'Entertainment & Events', riskBase: 11 },
  { id: 'MERCH_902', name: 'Shady Crypto P2P Desk', category: 'Peer to Peer / Non-Merchant', riskBase: 82 }
];

const CHANNELS = ['UPI', 'UPI', 'UPI', 'IMPS', 'Debit Card', 'Net Banking', 'NEFT'];

const USERS = [
  'A001', 'A002', 'A003', 'A004', 'A005',
  'USR_1001', 'USR_1002', 'USR_1003', 'USR_1004', 'USR_1005',
  'USR_1006', 'USR_1007', 'USR_1008', 'USR_1009', 'USR_1010'
];

let globalTxCounter = 1200;

/**
 * Generates a single realistic simulated transaction record.
 * Evaluates through actual backend prediction API if available.
 */
export async function generateLiveTransaction() {
  globalTxCounter += 1;
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toISOString().split('T')[0];
  const timestamp = `${dateStr} ${timeStr}`;
  const txId = `TXN_SIM_${globalTxCounter}`;

  // Select realistic geography
  const state = STATES[Math.floor(Math.random() * STATES.length)];
  const districts = INDIAN_STATES_DISTRICTS[state] || ['Central'];
  const district = districts[Math.floor(Math.random() * (districts.length - 1))];

  // Distribution roll
  const roll = Math.random();
  let amount = 0;
  let merchant = MERCHANTS[0];
  let user = USERS[Math.floor(Math.random() * USERS.length)];
  let channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  let deviceId = `DEV_${Math.floor(1000 + Math.random() * 9000)}`;
  let isAnomalous = false;

  if (roll < 0.65) {
    // 65% everyday small purchases (₹120 – ₹1,450)
    amount = Math.round(120 + Math.random() * 1330);
    merchant = MERCHANTS[Math.floor(Math.random() * 4)];
    channel = 'UPI';
  } else if (roll < 0.85) {
    // 20% medium shopping / services (₹1,500 – ₹8,900)
    amount = Math.round(1500 + Math.random() * 7400);
    merchant = MERCHANTS[Math.floor(Math.random() * 7)];
    channel = Math.random() > 0.5 ? 'Debit Card' : 'IMPS';
  } else if (roll < 0.94) {
    // 9% high-value legitimate payments (₹12,000 – ₹48,000)
    amount = Math.round(12000 + Math.random() * 36000);
    merchant = MERCHANTS[Math.floor(Math.random() * 7)];
    channel = Math.random() > 0.5 ? 'Net Banking' : 'NEFT';
  } else {
    // 6% high-risk suspicious anomaly (e.g. unknown device, high velocity or rapid outflow)
    amount = Math.round(62000 + Math.random() * 85000);
    merchant = Math.random() > 0.5 ? MERCHANTS[9] : MERCHANTS[3]; // Shady P2P or Croma
    channel = 'Net Banking';
    deviceId = Math.random() > 0.5 ? 'DEV_4102' : 'DEV_9910'; // Known emulator fingerprint in our PayGuard test set
    isAnomalous = true;
  }

  const payload = {
    transaction_id: txId,
    user_id: user,
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    merchant_category: merchant.category,
    amount: amount,
    currency: 'INR',
    payment_method: channel,
    location: `${district}, ${state}`,
    state: state,
    district: district,
    device_id: deviceId,
    timestamp: timestamp,
    transaction_type: 'Merchant Purchase',
    is_demo: false
  };

  try {
    // Attempt genuine backend model prediction pipeline
    const pred = await transactionsAPI.predict(payload);
    return {
      ...payload,
      ml_score: Number(pred.ml_score ?? pred.risk_score ?? 15),
      gnn_score: Number(pred.gnn_score ?? 10),
      hybrid_score: Number(pred.hybrid_risk_score ?? pred.risk_score ?? 15),
      prediction: pred.prediction || (pred.risk_score >= 75 ? 'Fraud' : pred.risk_score >= 40 ? 'Suspicious' : 'Safe'),
      final_classification: pred.final_classification || (pred.risk_score >= 75 ? 'Potentially suspicious' : pred.risk_score >= 40 ? 'Review' : 'Legitimate'),
      explanation: pred.explanation || 'Processed through hybrid model inference pipeline.',
      model_source: 'GENUINE_HYBRID_PIPELINE',
      is_simulated_live: true
    };
  } catch (err) {
    // Clean, deterministic, documented fallback if backend is offline/starting up
    const baseRisk = merchant.riskBase;
    const amountFactor = amount > 50000 ? 45 : amount > 15000 ? 20 : 5;
    const deviceFactor = (deviceId === 'DEV_4102' || deviceId === 'DEV_9910') ? 45 : 0;
    const computedRisk = Math.min(99, Math.round(baseRisk * 0.4 + amountFactor + deviceFactor));

    let finalClass = 'Legitimate';
    let predTag = 'Safe';
    if (computedRisk >= 75) {
      finalClass = 'Potentially suspicious';
      predTag = 'Fraud';
    } else if (computedRisk >= 40) {
      finalClass = 'Review';
      predTag = 'Suspicious';
    }

    return {
      ...payload,
      ml_score: Math.max(5, computedRisk - 8),
      gnn_score: isAnomalous ? computedRisk : Math.max(5, computedRisk - 12),
      hybrid_score: computedRisk,
      prediction: predTag,
      final_classification: finalClass,
      explanation: isAnomalous
        ? 'High value on suspicious device fingerprint DEV_4102 with non-standard velocity.'
        : 'Small-to-moderate retail transaction within normal account profile spending variance.',
      model_source: 'DEMO_MODE_DETERMINISTIC',
      is_simulated_live: true
    };
  }
}
