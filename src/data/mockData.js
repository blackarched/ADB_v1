export const initialNetworkData = [
    { ssid: 'HomeNetwork_5G', bssid: 'AA:BB:CC:DD:EE:FF', channel: 36, power: -45, encryption: 'WPA2', clients: 5, status: 'secure' },
    { ssid: 'CoffeeShop_WiFi', bssid: 'BB:CC:DD:EE:FF:AA', channel: 6, power: -67, encryption: 'WPA2', clients: 12, status: 'secure' },
    { ssid: 'NETGEAR_Guest', bssid: 'CC:DD:EE:FF:AA:BB', channel: 11, power: -72, encryption: 'Open', clients: 3, status: 'vulnerable' },
    { ssid: 'Office_Network', bssid: 'DD:EE:FF:AA:BB:CC', channel: 1, power: -58, encryption: 'WPA3', clients: 8, status: 'secure' },
    { ssid: 'Xfinity-WiFi', bssid: 'EE:FF:AA:BB:CC:DD', channel: 8, power: -80, encryption: 'Open', clients: 15, status: 'vulnerable' }
];

export const initialHandshakeData = [
    { target: 'HomeNetwork_5G', bssid: 'AA:BB:CC:DD:EE:FF', captured: '2m ago', status: 'complete', quality: 'excellent' },
    { target: 'CoffeeShop_WiFi', bssid: 'BB:CC:DD:EE:FF:AA', captured: '5m ago', status: 'complete', quality: 'good' },
    { target: 'Office_Network', bssid: 'DD:EE:FF:AA:BB:CC', captured: '12m ago', status: 'partial', quality: 'poor' }
];

export const initialTerminalOutput = [
    'INTRUDER v2.0 - Cyberpunk WiFi Pentesting Suite',
    'Initializing modules...',
    '[✓] Monitor mode activated on wlan0mon',
    '[✓] SocketIO connection established',
    '----------------------------------------',
    'Awaiting commands...',
];

export const sidebarItems = [
    { id: 'dashboard', icon: 'Activity', label: 'Dashboard' },
    { id: 'scan', icon: 'Search', label: 'Network Scan' },
    { id: 'handshake', icon: 'Zap', label: 'Handshake Capture' },
    { id: 'deauth', icon: 'Target', label: 'Deauth Attack' },
    { id: 'crack', icon: 'Unlock', label: 'Crack Handshake' },
    { id: 'reports', icon: 'BarChart3', label: 'Reports' }
];