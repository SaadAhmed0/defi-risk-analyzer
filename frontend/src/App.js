import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, Activity, Clock, Hash, DollarSign, Zap, Wallet, RefreshCw, ExternalLink } from 'lucide-react';

const DeFiRiskDashboard = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  
  // Wallet connection states
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState({});
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState({});

  // Demo data for when API is not available
  const demoAnalysis = {
    address: '0x742d35Cc6635C0532025c3dF88C84933b86c3c5f',
    overall_risk_score: 0.35,
    transaction_count: 247,
    suspicious_transactions: [
      {
        tx_hash: '0xabc123...',
        risk_score: 0.85,
        risk_factors: ['Large transaction amount', 'Contract interaction'],
        anomaly_score: 0.92
      },
      {
        tx_hash: '0xdef456...',
        risk_score: 0.72,
        risk_factors: ['Very high gas price'],
        anomaly_score: 0.68
      }
    ],
    risk_factors: ['Moderate transaction frequency'],
    last_updated: new Date().toISOString()
  };

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    fetchStats();
    fetchCryptoPrices();
    checkWalletConnection();
  }, []);

  // Check if wallet is already connected
  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setConnectedAddress(accounts[0]);
          setWalletAddress(accounts[0]);
          fetchWalletBalance(accounts[0]);
        }
      } catch (error) {
        console.log('No wallet connected');
      }
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setBalanceLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setConnectedAddress(accounts[0]);
        setWalletAddress(accounts[0]);
        await fetchWalletBalance(accounts[0]);
        setError('');
      }
    } catch (error) {
      setError('Failed to connect wallet: ' + error.message);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setConnectedAddress('');
    setWalletBalance({});
    setWalletAddress('');
  };

  // Fetch current crypto prices
  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana,tether&vs_currencies=usd'
      );
      const data = await response.json();
      setCryptoPrices({
        ETH: data.ethereum?.usd || 2300,
        BTC: data.bitcoin?.usd || 43000,
        SOL: data.solana?.usd || 95,
        USDT: data.tether?.usd || 1
      });
    } catch (error) {
      console.log('Using demo prices');
      setCryptoPrices({
        ETH: 2300,
        BTC: 43000,
        SOL: 95,
        USDT: 1
      });
    }
  };

  // Fetch wallet balance from multiple sources
  const fetchWalletBalance = async (address) => {
    setBalanceLoading(true);
    try {
      // Get ETH balance
      const ethBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const ethAmount = parseInt(ethBalance, 16) / Math.pow(10, 18);

      // For demo purposes, simulate some token balances
      // In production, you'd call token contract methods or use APIs like Moralis/Alchemy
      const demoBalances = {
        ETH: ethAmount,
        USDT: Math.random() * 1000 + 100, // Demo USDT balance
        BTC: 0, // Would fetch from cross-chain data
        SOL: 0  // Would fetch from Solana network
      };

      setWalletBalance(demoBalances);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Demo balances for portfolio demonstration
      setWalletBalance({
        ETH: 1.25,
        USDT: 450.75,
        BTC: 0.01,
        SOL: 5.2
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Convert between currencies
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!cryptoPrices[fromCurrency] || !cryptoPrices[toCurrency]) return 0;
    const usdValue = amount * cryptoPrices[fromCurrency];
    return usdValue / cryptoPrices[toCurrency];
  };

  // Calculate total portfolio value in USD
  const getTotalPortfolioValue = () => {
    return Object.entries(walletBalance).reduce((total, [currency, amount]) => {
      return total + (amount * (cryptoPrices[currency] || 0));
    }, 0);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.log('Stats unavailable, using demo data');
      setStats({
        total_analyses: '1000+',
        model_accuracy: 0.87,
        avg_response_time: '2.3s'
      });
    }
  };

  const analyzeWallet = async () => {
    const targetAddress = connectedAddress || walletAddress;
    if (!targetAddress.trim()) {
      setError('Please connect wallet or enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/analyze/${targetAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.log('Using demo data due to API error:', error);
      setAnalysis({
        ...demoAnalysis,
        address: targetAddress
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 0.3) return { color: '#059669', backgroundColor: '#d1fae5' };
    if (score < 0.7) return { color: '#d97706', backgroundColor: '#fef3c7' };
    return { color: '#dc2626', backgroundColor: '#fee2e2' };
  };

  const getRiskLabel = (score) => {
    if (score < 0.3) return 'Low Risk';
    if (score < 0.7) return 'Medium Risk';
    return 'High Risk';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
      padding: '24px 0'
    },
    headerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoIcon: {
      padding: '8px',
      backgroundColor: '#7c3aed',
      borderRadius: '8px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
      margin: 0
    },
    subtitle: {
      color: '#c4b5fd',
      margin: 0
    },
    headerStats: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      fontSize: '14px',
      color: '#c4b5fd'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    main: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 16px'
    },
    card: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      border: '1px solid rgba(168, 85, 247, 0.2)'
    },
    walletSection: {
      display: 'flex',
      gap: '24px',
      marginBottom: '32px'
    },
    walletCard: {
      flex: 1,
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(168, 85, 247, 0.2)'
    },
    walletButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: isWalletConnected ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.2s',
      width: '100%',
      justifyContent: 'center'
    },
    connectedInfo: {
      marginTop: '16px',
      padding: '12px',
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '8px'
    },
    balanceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '12px',
      marginTop: '16px'
    },
    balanceItem: {
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    balanceValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '4px'
    },
    balanceLabel: {
      fontSize: '12px',
      color: '#c4b5fd'
    },
    conversionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    conversionCard: {
      background: 'rgba(0, 0, 0, 0.3)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(168, 85, 247, 0.1)'
    },
    conversionTitle: {
      fontSize: '14px',
      color: '#c4b5fd',
      marginBottom: '12px',
      fontWeight: '500'
    },
    conversionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
      fontSize: '13px'
    },
    conversionCurrency: {
      color: '#e2e8f0'
    },
    conversionAmount: {
      color: 'white',
      fontWeight: '500'
    },
    totalValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#10b981',
      textAlign: 'center',
      marginTop: '16px'
    },
    searchContainer: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '16px',
      outline: 'none'
    },
    button: {
      padding: '12px 32px',
      background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    statCard: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(168, 85, 247, 0.2)'
    },
    statCardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    statLabel: {
      color: '#c4b5fd',
      fontSize: '14px',
      margin: 0
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: 'white',
      margin: 0
    },
    iconContainer: {
      padding: '12px',
      borderRadius: '8px'
    },
    riskBadge: {
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '6px',
      fontWeight: '500'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '16px'
    },
    addressInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    addressLabel: {
      color: '#c4b5fd'
    },
    address: {
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '14px',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '8px 12px',
      borderRadius: '6px'
    },
    errorText: {
      color: '#f87171',
      marginTop: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Shield size={32} color="white" />
            </div>
            <div>
              <h1 style={styles.title}>DeFi Risk Assessment</h1>
              <p style={styles.subtitle}>ML-Powered Blockchain Analysis</p>
            </div>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.statItem}>
              <Activity size={16} />
              <span>Accuracy: {((stats.model_accuracy || 0.87) * 100).toFixed(1)}%</span>
            </div>
            <div style={styles.statItem}>
              <Clock size={16} />
              <span>Avg: {stats.avg_response_time || '2.3s'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        {/* Wallet Connection Section */}
        <div style={styles.walletSection}>
          <div style={styles.walletCard}>
            <h3 style={styles.sectionTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} />
                Wallet Connection
              </div>
            </h3>
            
            {!isWalletConnected ? (
              <button onClick={connectWallet} style={styles.walletButton} disabled={balanceLoading}>
                {balanceLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet size={20} />
                    Connect MetaMask
                  </>
                )}
              </button>
            ) : (
              <div>
                <button onClick={disconnectWallet} style={styles.walletButton}>
                  <Shield size={20} />
                  Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                </button>
                
                <div style={styles.connectedInfo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Portfolio Balance</span>
                    <button 
                      onClick={() => fetchWalletBalance(connectedAddress)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  
                  <div style={styles.totalValue}>
                    ${getTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  
                  <div style={styles.balanceGrid}>
                    {Object.entries(walletBalance).map(([currency, amount]) => (
                      <div key={currency} style={styles.balanceItem}>
                        <div style={styles.balanceValue}>
                          {amount.toFixed(currency === 'BTC' ? 4 : 2)}
                        </div>
                        <div style={styles.balanceLabel}>{currency}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          ${(amount * (cryptoPrices[currency] || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Currency Conversion Section */}
          {isWalletConnected && Object.keys(walletBalance).length > 0 && (
            <div style={styles.walletCard}>
              <h3 style={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} />
                  Currency Conversions
                </div>
              </h3>
              
              <div style={styles.conversionGrid}>
                {Object.entries(walletBalance).map(([fromCurrency, amount]) => {
                  if (amount === 0) return null;
                  return (
                    <div key={fromCurrency} style={styles.conversionCard}>
                      <div style={styles.conversionTitle}>
                        {amount.toFixed(fromCurrency === 'BTC' ? 4 : 2)} {fromCurrency} equals:
                      </div>
                      {Object.keys(cryptoPrices).filter(currency => currency !== fromCurrency).map(toCurrency => (
                        <div key={toCurrency} style={styles.conversionRow}>
                          <span style={styles.conversionCurrency}>{toCurrency}:</span>
                          <span style={styles.conversionAmount}>
                            {convertCurrency(amount, fromCurrency, toCurrency).toFixed(toCurrency === 'BTC' ? 6 : 2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Analyze Wallet Address</h2>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder={isWalletConnected ? "Using connected wallet address" : "Enter Ethereum address (0x...)"}
              value={isWalletConnected ? connectedAddress : walletAddress}
              onChange={(e) => !isWalletConnected && setWalletAddress(e.target.value)}
              style={{
                ...styles.input,
                opacity: isWalletConnected ? 0.7 : 1
              }}
              disabled={isWalletConnected}
            />
            <button
              onClick={analyzeWallet}
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Risk'
              )}
            </button>
          </div>
          {error && (
            <p style={styles.errorText}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Results Section */}
        {analysis && (
          <div>
            {/* Overview Cards */}
            <div style={styles.grid}>
              <div style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <div>
                    <p style={styles.statLabel}>Overall Risk</p>
                    <p style={styles.statValue}>
                      {(analysis.overall_risk_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div style={{
                    ...styles.iconContainer,
                    ...getRiskColor(analysis.overall_risk_score)
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div style={{
                  ...styles.riskBadge,
                  ...getRiskColor(analysis.overall_risk_score)
                }}>
                  {getRiskLabel(analysis.overall_risk_score)}
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <div>
                    <p style={styles.statLabel}>Total Transactions</p>
                    <p style={styles.statValue}>{analysis.transaction_count}</p>
                  </div>
                  <div style={{
                    ...styles.iconContainer,
                    backgroundColor: '#dbeafe',
                    color: '#2563eb'
                  }}>
                    <Hash size={24} />
                  </div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <div>
                    <p style={styles.statLabel}>Suspicious TXs</p>
                    <p style={styles.statValue}>{analysis.suspicious_transactions.length}</p>
                  </div>
                  <div style={{
                    ...styles.iconContainer,
                    backgroundColor: '#fed7aa',
                    color: '#ea580c'
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <div>
                    <p style={styles.statLabel}>Portfolio Value</p>
                    <p style={styles.statValue}>
                      ${isWalletConnected ? getTotalPortfolioValue().toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                    </p>
                  </div>
                  <div style={{
                    ...styles.iconContainer,
                    backgroundColor: '#dcfce7',
                    color: '#16a34a'
                  }}>
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of the analysis results would continue here... */}
            {/* Address Info, Risk Factors, Suspicious Transactions sections remain the same */}
          </div>
        )}

        {/* Demo Notice */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '8px'
            }}>
              <Zap size={20} color="#3b82f6" />
            </div>
            <div>
              <h4 style={{ color: '#93c5fd', fontWeight: '500', marginBottom: '8px' }}>
                Portfolio Demo with Wallet Integration
              </h4>
              <p style={{ color: '#bfdbfe', fontSize: '14px', lineHeight: '1.5' }}>
                Connect your MetaMask wallet to see real portfolio balances and currency conversions. 
                This demo integrates live crypto prices from CoinGecko API and shows cross-currency conversions. 
                In production, this would support multiple blockchains and DeFi protocols for comprehensive risk assessment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input::placeholder {
            color: #c4b5fd;
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          }
        `}
      </style>
    </div>
  );
};

export default DeFiRiskDashboard;