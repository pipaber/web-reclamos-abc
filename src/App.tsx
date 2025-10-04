import { useState } from 'react';

const mockData = {
  clients: [
    { id: 1, full_name: "Ada Lovelace", email: "ada@example.com", dni: "12345678", phone: "+51-111-222" },
    { id: 2, full_name: "Alan Turing", email: "alan@example.com", dni: "87654321", phone: "+51-333-444" }
  ],
  cards: [
    { id: 1, client_id: 1, brand: "VISA", last4: "1111", status: "active" },
    { id: 2, client_id: 1, brand: "Mastercard", last4: "0004", status: "active" },
    { id: 3, client_id: 2, brand: "Amex", last4: "1009", status: "blocked" }
  ],
  movements: [
    { id: 1, credit_card_id: 1, amount_cents: 2599, currency: "USD", merchant_name: "Amazon", occurred_at: "2025-01-05T12:00:00Z", status: "posted" },
    { id: 2, credit_card_id: 1, amount_cents: 1099, currency: "USD", merchant_name: "Starbucks", occurred_at: "2025-01-06T08:30:00Z", status: "posted" },
    { id: 3, credit_card_id: 2, amount_cents: 15000, currency: "USD", merchant_name: "Best Buy", occurred_at: "2025-01-07T15:00:00Z", status: "posted" },
    { id: 4, credit_card_id: 3, amount_cents: 5000, currency: "USD", merchant_name: "Shell Gas", occurred_at: "2025-01-10T10:00:00Z", status: "posted" },
    { id: 5, credit_card_id: 1, amount_cents: 7500, currency: "USD", merchant_name: "Uber", occurred_at: "2025-01-15T18:00:00Z", status: "posted" }
  ],
  claims: [
    { 
      id: 1, 
      client_id: 1, 
      credit_card_id: 1, 
      reason_code: "fraud", 
      description: "I did not authorize these transactions. My card was stolen on January 4th.", 
      status: "under_review", 
      opened_at: "2025-01-08T10:00:00Z", 
      resolved_at: null, 
      movement_ids: [1, 2] 
    },
    { 
      id: 2, 
      client_id: 1, 
      credit_card_id: 2, 
      reason_code: "not_received", 
      description: "I purchased a laptop but never received the product despite multiple attempts to contact the merchant.", 
      status: "open", 
      opened_at: "2025-01-12T14:00:00Z", 
      resolved_at: null, 
      movement_ids: [3] 
    },
    { 
      id: 3, 
      client_id: 2, 
      credit_card_id: 3, 
      reason_code: "duplicate", 
      description: "This charge appears twice on my statement for the same transaction.", 
      status: "resolved", 
      opened_at: "2025-01-11T09:00:00Z", 
      resolved_at: "2025-01-20T16:30:00Z", 
      movement_ids: [4] 
    }
  ]
};

export default function App() {
  const [dni, setDni] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    setSearchPerformed(true);

    const client = mockData.clients.find(c => c.dni === dni.trim());
    
    if (!client) {
      setClientData(null);
      setError('No se encontró un cliente con ese DNI');
      return;
    }

    const clientClaims = mockData.claims.filter(claim => claim.client_id === client.id);

    if (clientClaims.length === 0) {
      setClientData({ client, claims: [], cards: [], movements: [] });
      return;
    }

    const cardIds = [...new Set(clientClaims.map(c => c.credit_card_id).filter(Boolean))];
    const relatedCards = mockData.cards.filter(card => cardIds.includes(card.id));

    const movementIds = clientClaims.flatMap(c => c.movement_ids);
    const relatedMovements = mockData.movements.filter(m => movementIds.includes(m.id));

    setClientData({
      client,
      claims: clientClaims,
      cards: relatedCards,
      movements: relatedMovements
    });
  };

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency 
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Abierto' },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Revisión' },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resuelto' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getReasonLabel = (code: string) => {
    const reasons: any = {
      fraud: 'Fraude',
      not_received: 'Producto no recibido',
      duplicate: 'Cargo duplicado',
      quality: 'Problema de calidad'
    };
    return reasons[code] || code;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-600 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Consulta de Reclamos</h1>
          <p className="text-gray-600 text-lg">Ingresa tu DNI para consultar el estado de tus reclamos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Documento Nacional de Identidad (DNI)
              </label>
              <input
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 12345678"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                maxLength={8}
              />
              <p className="text-xs text-gray-500 mt-2">Ingrese 8 dígitos numéricos</p>
            </div>
            <button 
              onClick={handleSearch}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Consultar Reclamos
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">DNIs de ejemplo para probar:</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDni('12345678')}
                className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                12345678
              </button>
              <button 
                onClick={() => setDni('87654321')}
                className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                87654321
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {searchPerformed && clientData && clientData.claims.length === 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-800 font-medium">No se encontraron reclamos</p>
                <p className="text-blue-700 text-sm mt-1">Hola {clientData.client.full_name}, actualmente no tienes reclamos registrados.</p>
              </div>
            </div>
          </div>
        )}

        {clientData && clientData.claims.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Hola, {clientData.client.full_name}
              </h2>
              <p className="text-gray-600">
                Tienes {clientData.claims.length} reclamo{clientData.claims.length !== 1 ? 's' : ''} registrado{clientData.claims.length !== 1 ? 's' : ''}
              </p>
            </div>

            {clientData.claims.map((claim: any) => {
              const card = clientData.cards.find((c: any) => c.id === claim.credit_card_id);
              const claimMovements = clientData.movements.filter((m: any) => 
                claim.movement_ids.includes(m.id)
              );

              return (
                <div key={claim.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Reclamo</p>
                        <h3 className="text-3xl font-bold">#{claim.id}</h3>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                    <div className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full">
                      <p className="text-sm font-semibold">{getReasonLabel(claim.reason_code)}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Descripción del Reclamo
                      </h4>
                      <p className="text-gray-800 text-lg leading-relaxed">
                        {claim.description}
                      </p>
                    </div>

                    {card && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Tarjeta Involucrada
                        </h4>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-indigo-100 rounded">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{card.brand}</p>
                            <p className="text-gray-600">**** **** **** {card.last4}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {claimMovements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Transacciones Relacionadas
                        </h4>
                        <div className="space-y-3">
                          {claimMovements.map((mov: any) => (
                            <div key={mov.id} className="flex justify-between items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{mov.merchant_name}</p>
                                <p className="text-sm text-gray-500">{formatDate(mov.occurred_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">
                                  {formatAmount(mov.amount_cents, mov.currency)}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{mov.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Línea de Tiempo
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 bg-indigo-600 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900">Reclamo Creado</p>
                            <p className="text-sm text-gray-600">{formatDate(claim.opened_at)}</p>
                          </div>
                        </div>
                        {claim.resolved_at && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-900">Reclamo Resuelto</p>
                              <p className="text-sm text-gray-600">{formatDate(claim.resolved_at)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}