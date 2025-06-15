import { Server } from '../types/server';

export const sortServersByPriority = (servers: Server[]): Server[] => {
  const priorityOrder = {
    offline: 0,
    warning: 1,
    online: 2,
  };

  return [...servers].sort((a, b) => {
    const priorityA =
      priorityOrder[a.status as keyof typeof priorityOrder] ?? 3;
    const priorityB =
      priorityOrder[b.status as keyof typeof priorityOrder] ?? 3;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 같은 우선순위 내에서는 알파벳 순으로 정렬
    return a.name.localeCompare(b.name);
  });
};

export const mapStatus = (status: string): 'online' | 'offline' | 'warning' => {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'running':
    case 'active':
    case 'up':
      return 'online';
    case 'down':
    case 'stopped':
    case 'inactive':
    case 'error':
      return 'offline';
    case 'warning':
    case 'degraded':
    case 'slow':
      return 'warning';
    default:
      return 'offline';
  }
};

export const getServerStats = (servers: Server[]) => {
  const total = servers.length;
  const online = servers.filter(s => s.status === 'online').length;
  const warning = servers.filter(s => s.status === 'warning').length;
  const offline = servers.filter(s => s.status === 'offline').length;

  return { total, online, warning, offline };
};

export const filterServers = (
  servers: Server[],
  searchTerm: string,
  statusFilter: string,
  locationFilter: string
): Server[] => {
  return servers.filter(server => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || server.status === statusFilter;

    const matchesLocation =
      locationFilter === 'all' || server.location === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });
};

export const getUniqueLocations = (servers: Server[]): string[] => {
  const locations = servers.map(server => server.location);
  return Array.from(new Set(locations)).sort();
};
