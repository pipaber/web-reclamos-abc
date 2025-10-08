import { useState } from 'react';
import {
  fetchClientIdByDni,
  fetchAllCards,
  fetchAllClaims,
  fetchMovementsByClientId,
  fetchMovementsByClientIndex,
  mapClientIdToMovementsIndex,
  fetchClaimTypes,
  fetchClaimStatuses,
} from './api';

// Interfaces for API responses
interface ClientAPI { id: number; }

interface CardAPI {
  tarjeta_id: string;
  masc_num: string;
  created_at: number;
  cvv_hash: string;
  red_id: number;
  brand: string;
  date_exp: number;
  account_id: number;
  estado: string;
  id_cliente: string;
}

interface MovementAPI {
  IDTarjeta: string;
  TarjetaID?: string;
  Sector: string;
  IDCanal: string;
  telefono: string;
  IndicadorAprobada: string;
  Monto: string;
  ComercioID: string;
  Estado: string;
  FechaCarga: string;
  NombreComercio: string;
  FechaHoraISO: string;
  Fecha: string;
  LatenciaAutorizacionMs: string;
  NombreCompleto: string;
  Fraude: string;
  DNI: string;
  CodigoAutorizacion: string;
  Canal: string;
  CodigoMoneda: string;
  IDTransaccion: string;
  ClienteID: string;
  IDMoneda: string;
  IDCliente: string;
  IDComercio: string;
  Hora: string;
  MontoBruto: string;
  Tarjeta: string;
  IDEstado: string;
  Producto: string;
  email: string;
  FechaHoraOrden: string;
  TasaCambio: string;
}

interface ClaimAPI {
  id_cliente: number;
  id_producto: number; // This is likely the credit_card_id
  id_tipo_reclamo: number;
  id_estado_actual: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  canal: string;
  referencia_externa: string;
  descripcion: string;
  monto: number;
  moneda: string;
  id_reclamo: number;
  fecha_actualizacion: string;
}

interface ClaimTypeAPI {
  codigo: string;
  nombre: string;
  descripcion: string;
  id_tipo_reclamo: number;
}

interface ClaimStatusAPI {
  codigo: string;
  nombre: string;
  id_estado: number;
}

// Interfaces for processed data (to match UI expectations)
interface Client {
  id: number;
  full_name: string;
  email: string;
  dni: string;
  phone: string; // This might not be available from APIs directly
}

interface Card {
  id: number;
  client_id: number;
  brand: string;
  last4: string;
  status: string;
}

interface Movement {
  id: number;
  credit_card_id: number;
  amount_cents: number;
  currency: string;
  merchant_name: string;
  occurred_at: string;
  status: string;
}

interface Claim {
  id: number;
  client_id: number;
  credit_card_id: number;
  reason_code: string;
  description: string;
  status: string;
  opened_at: string;
  resolved_at: string | null;
  movement_ids: number[]; // This will be derived or linked differently
}

interface ClientData {
  client: Client;
  claims: Claim[];
  cards: Card[];
  movements: Movement[];
}


export default function App() {
  const [dni, setDni] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardMovementsLoading, setCardMovementsLoading] = useState<Record<number, boolean>>({});
  const [expandedCardIds, setExpandedCardIds] = useState<Record<number, boolean>>({});

  const handleSearch = async () => {
    setError('');
    setSearchPerformed(true);
    setClientData(null);
    setIsLoading(true);

    try {
      // 1. Fetch client ID
      const clientResponse: ClientAPI = await fetchClientIdByDni(dni.trim());
      const clientId = clientResponse.id;

      if (!clientId) {
        setError('No se encontró un cliente con ese DNI');
        return;
      }

      // 2. Fetch claims, cards, claim-types and statuses in parallel. Movements
      // are fetched using the movements API index mapping (see below) after
      // we have the clientId and the cards.
      const [allClaimsResponse, allCardsResponse, claimTypesResponse, claimStatusesResponse] = await Promise.all([
        fetchAllClaims(),
        fetchAllCards(),
        fetchClaimTypes(),
        fetchClaimStatuses(),
      ]);

      // Map clientId to movements API index (100001 -> 1)
      const clientIndex = mapClientIdToMovementsIndex(clientId);

      // Fetch movements using the compact index
      const movementsResponse = await fetchMovementsByClientIndex(clientIndex);

      const allClaims: ClaimAPI[] = allClaimsResponse;
      const allCards: { tarjetas: CardAPI[] } = allCardsResponse;
      const allMovements: { data: MovementAPI[] } = movementsResponse;
      const claimTypes: ClaimTypeAPI[] = claimTypesResponse;
      const claimStatuses: ClaimStatusAPI[] = claimStatusesResponse;

      // 3. Process and filter data
      const clientClaims = allClaims.filter(claim => claim.id_cliente === clientId);

      if (clientClaims.length === 0) {
        // For now, we'll create a dummy client object with minimal info
        // In a real app, you might have a dedicated client details API
        const client: Client = {
          id: clientId,
          full_name: `Cliente ${dni.trim()}`, // Placeholder
          email: '', // Placeholder
          dni: dni.trim(),
          phone: '', // Placeholder
        };
        setClientData({ client, claims: [], cards: [], movements: [] });
        return;
      }

      const processedCards: Card[] = allCards.tarjetas
        .filter(card => card.id_cliente === String(clientId)) // API returns id_cliente as string
        .map(card => ({
          id: parseInt(card.tarjeta_id),
          client_id: parseInt(card.id_cliente),
          brand: card.brand,
          last4: card.masc_num,
          status: card.estado, // Direct mapping for now
        }));

      // Associate movements to cards by matching movement.IDTarjeta (or TarjetaID)
      const processedMovements: Movement[] = allMovements.data
        .map(mov => {
          const rawCardId = mov.IDTarjeta || mov.TarjetaID;
          const creditCardId = rawCardId ? parseInt(String(rawCardId), 10) : NaN;
          return {
            id: parseInt(mov.IDTransaccion, 10),
            credit_card_id: Number.isNaN(creditCardId) ? -1 : creditCardId,
            amount_cents: Math.round(parseFloat(mov.Monto || '0') * 100),
            currency: mov.CodigoMoneda || 'PEN',
            merchant_name: mov.NombreComercio,
            occurred_at: mov.FechaHoraISO ? new Date(mov.FechaHoraISO).toISOString() : new Date().toISOString(),
            status: mov.Estado,
          } as Movement;
        })
        .filter(mov => mov.credit_card_id > 0);

      const processedClaims: Claim[] = clientClaims.map(claim => {
        const claimType = claimTypes.find(type => type.id_tipo_reclamo === claim.id_tipo_reclamo);
        const claimStatus = claimStatuses.find(status => status.id_estado === claim.id_estado_actual);

        // Link movements to claims based on card and date range (approximation)
        const relatedMovements = processedMovements.filter(mov => {
          const movementDate = new Date(mov.occurred_at);
          const claimOpenedDate = new Date(claim.fecha_apertura);
          const claimResolvedDate = claim.fecha_cierre ? new Date(claim.fecha_cierre) : null;

          return (
            mov.credit_card_id === claim.id_producto && // Assuming id_producto is credit_card_id
            movementDate >= claimOpenedDate &&
            (!claimResolvedDate || movementDate <= claimResolvedDate)
          );
        }).map(mov => mov.id);

        return {
          id: claim.id_reclamo,
          client_id: claim.id_cliente,
          credit_card_id: claim.id_producto, // Assuming id_producto is credit_card_id
          reason_code: claimType?.codigo || 'unknown',
          description: claim.descripcion,
          status: claimStatus?.codigo || 'unknown',
          opened_at: claim.fecha_apertura,
          resolved_at: claim.fecha_cierre,
          movement_ids: relatedMovements,
        };
      });

      // Derive client full_name, email, phone from movements if available
      let clientFullName = `Cliente ${dni.trim()}`;
      let clientEmail = '';
      let clientPhone = '';

      if (allMovements.data.length > 0) {
        const firstMovement = allMovements.data[0];
        clientFullName = firstMovement.NombreCompleto || clientFullName;
        clientEmail = firstMovement.email || clientEmail;
        clientPhone = firstMovement.telefono || clientPhone;
      }

      const client: Client = {
        id: clientId,
        full_name: clientFullName,
        email: clientEmail,
        dni: dni.trim(),
        phone: clientPhone,
      };

      setClientData({
        client,
        claims: processedClaims,
        cards: processedCards,
        movements: processedMovements,
      });

    } catch (err: any) {
      console.error("Error during search:", err);
      setError(err.message || 'Ocurrió un error al buscar los reclamos.');
    } finally {
      setIsLoading(false);
    }
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
      ASIGNADO: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Asignado' },
      PENDIENTE_DE_RASTREO: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente de Rastreo' },
      RASTREADO: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Rastreado' },
      PENDIENTE_DE_VALIDACION: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pendiente de Validación' },
      VALIDADO: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validado' },
      NOTIFICADO: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Notificado' },
      CERRADO: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrado' },
      unknown: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Desconocido' },
    };

    const config = statusConfig[status] || statusConfig.unknown;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getReasonLabel = (code: string) => {
    const reasons: any = {
      FRAUDE_TARJETA: 'Fraude en tarjeta',
      DOBLE_COBRO: 'Doble cobro',
      NO_ENTREGA: 'Producto no recibido',
      CARGO_NO_AUTORIZADO: 'Cargo no autorizado',
      ERROR_MONTO: 'Error en monto',
      unknown: 'Desconocido'
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
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Consultar Reclamos'}
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

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-700">Cargando datos...</p>
          </div>
        )}

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

        {searchPerformed && !isLoading && clientData && clientData.claims.length === 0 && (
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

            {clientData.claims.map((claim: Claim) => {
              const card = clientData.cards.find((c: Card) => c.id === claim.credit_card_id);
              const claimMovements = clientData.movements.filter((m: Movement) =>
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
                          <div className="ml-auto">
                            <button
                              onClick={() => setExpandedCardIds(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 ml-4"
                            >
                              {expandedCardIds[card.id] ? 'Ocultar transacciones' : 'Ver transacciones'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {card && expandedCardIds[card.id] && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-gray-500 mb-2">Transacciones de la tarjeta</h5>
                        <div className="space-y-2">
                          {clientData.movements.filter(m => m.credit_card_id === card.id).length === 0 && (
                            <p className="text-sm text-gray-500">No se encontraron transacciones para esta tarjeta.</p>
                          )}
                          {clientData.movements.filter(m => m.credit_card_id === card.id).map(mov => (
                            <div key={mov.id} className="flex justify-between items-center p-3 border rounded">
                              <div>
                                <p className="font-medium">{mov.merchant_name}</p>
                                <p className="text-xs text-gray-500">{formatDate(mov.occurred_at)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatAmount(mov.amount_cents, mov.currency)}</p>
                                <p className="text-xs text-gray-500">{mov.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {claimMovements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Transacciones Relacionadas
                        </h4>
                        <div className="space-y-3">
                          {claimMovements.map((mov: Movement) => (
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