import { ClientItem, ClientOwner } from '../types';

export const POLARIST_TEAM_CLIENT_ID = 'client-polarist';

export const createPolaristTeamClient = (): ClientItem => ({
  id: POLARIST_TEAM_CLIENT_ID,
  name: 'Polarist',
  type: 'cliente',
  owner: 'polarist',
  isSystem: true,
  color: 'emerald',
  country: 'Uruguay',
  createdAt: new Date().toISOString(),
});

export const isPolaristTeamClient = (client: ClientItem): boolean =>
  client.id === POLARIST_TEAM_CLIENT_ID ||
  client.isSystem === true ||
  (client.owner === 'polarist' && client.name.trim().toLowerCase() === 'polarist');

export const getPersonalClientsWithPolarist = (
  clients: ClientItem[],
  owner: Exclude<ClientOwner, 'polarist'>
): ClientItem[] => clients.filter((client) => client.owner === owner || isPolaristTeamClient(client));

export const ensurePolaristTeamClient = (clients: ClientItem[]): ClientItem[] => {
  const index = clients.findIndex(isPolaristTeamClient);
  if (index < 0) return [createPolaristTeamClient(), ...clients];

  return clients.map((client, clientIndex) =>
    clientIndex === index
      ? { ...client, name: 'Polarist', owner: 'polarist', isSystem: true }
      : client
  );
};
