
// src/api.ts

const CLIENTS_API_URL = 'http://52.1.53.185:8000/api/clientes/lookup';
const CARDS_API_URL = 'https://ugl4isqmt3.execute-api.us-east-1.amazonaws.com/dev/tarjetas/listar';
const MOVEMENTS_API_URL = 'https://aln4z3dlj1.execute-api.us-east-1.amazonaws.com/transacciones/buscar-cliente';
// Use relative paths for these endpoints so the Create React App dev server
// proxy (configured in package.json) can forward requests to the real API
// host and avoid CORS issues during development.
const CLAIMS_API_URL = '/reclamos/';
const CLAIM_TYPES_API_URL = '/catalogos/tipos-reclamo';
const CLAIM_STATUSES_API_URL = '/catalogos/estados-reclamo';

export const fetchClientIdByDni = async (dni: string) => {
  const response = await fetch(`${CLIENTS_API_URL}?dni=${dni}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch client ID: ${response.statusText} ${JSON.stringify(errorData)}`);
  }
  return response.json();
};

export const fetchAllCards = async () => {
  const response = await fetch(CARDS_API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }
  return response.json();
};

export const fetchMovementsByClientId = async (clientId: number) => {
  const response = await fetch(`${MOVEMENTS_API_URL}?IDCliente=${clientId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch movements');
  }
  return response.json();
};

// Map a long client id (e.g. 100001) to the movements API compact index (e.g. 1).
// Heuristic: if clientId > 100000, subtract 100000. Otherwise return as-is.
// This is safe for the current backend where 100001 -> 1.
export const mapClientIdToMovementsIndex = (clientId: number | string): number => {
  const idNum = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;
  if (!Number.isFinite(idNum) || idNum <= 0) return 1; // fallback
  if (idNum > 100000) return idNum - 100000;
  return idNum;
};

// Fetch movements using the movements API's expected compact client index.
export const fetchMovementsByClientIndex = async (clientIndex: number) => {
  const response = await fetch(`${MOVEMENTS_API_URL}?IDCliente=${clientIndex}`);
  if (!response.ok) {
    throw new Error('Failed to fetch movements');
  }
  return response.json();
};

export const fetchAllClaims = async () => {
  const response = await fetch(CLAIMS_API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch claims');
  }
  return response.json();
};

export const fetchClaimTypes = async () => {
  const response = await fetch(CLAIM_TYPES_API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch claim types');
  }
  return response.json();
};

export const fetchClaimStatuses = async () => {
  const response = await fetch(CLAIM_STATUSES_API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch claim statuses');
  }
  return response.json();
};
