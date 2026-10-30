interface PodResources {
  requests: { cpu: string; memory: string }
  limits: { memory: string }
}

function pod(cpu: string, request: string, limit: string): PodResources {
  return { requests: { cpu, memory: request }, limits: { memory: limit } }
}

/**
 * Memory is limited everywhere, CPU is only requested: the node has 4 shared vCPUs and
 * throttling hurts more than it protects. The site gets real traffic, so the web pod is sized
 * like Paselio's production admin; the database is small.
 */
export const res = {
  postgres: pod('100m', '256Mi', '512Mi'),
  postgresSharedBuffers: '64MB',
  web: pod('250m', '384Mi', '768Mi'),
  /** drizzle-kit with the full node_modules. */
  schema: pod('100m', '256Mi', '512Mi'),
  quota: { requestsMemory: '1Gi', limitsMemory: '2Gi', requestsCpu: '600m', pods: '10' },
}
