export interface McpEntry {
  name: string
  url: string
  description: string
  category: string
  keywords: string[]
}

export const MCP_CATALOG: McpEntry[] = [
  {
    name: 'notion',
    url: 'https://mcp.notion.com/mcp',
    description: 'Read and write Notion pages, databases, and blocks.',
    category: 'productivity',
    keywords: ['docs', 'wiki', 'knowledge-base', 'notes', 'database', 'pages', 'notion']
  },
  {
    name: 'slack',
    url: 'https://mcp.slack.com/mcp',
    description: 'Send messages, read channels, and manage Slack workflows.',
    category: 'communication',
    keywords: ['chat', 'messaging', 'channels', 'notifications', 'slack', 'team']
  },
  {
    name: 'linear',
    url: 'https://mcp.linear.app/mcp',
    description: 'Manage issues, projects, and sprints in Linear.',
    category: 'project-management',
    keywords: ['issues', 'tickets', 'sprint', 'project', 'linear', 'tracking', 'bugs']
  },
  {
    name: 'sentry',
    url: 'https://mcp.sentry.dev/mcp',
    description: 'Query errors, stack traces, and performance data from Sentry.',
    category: 'observability',
    keywords: ['errors', 'monitoring', 'crashes', 'bugs', 'sentry', 'alerts', 'incidents']
  },
  {
    name: 'github',
    url: 'https://api.githubcopilot.com/mcp/',
    description: 'Access repos, PRs, issues, and code search on GitHub.',
    category: 'development',
    keywords: ['code', 'repos', 'pull-requests', 'issues', 'git', 'github', 'commits']
  },
  {
    name: 'jira',
    url: 'https://mcp.atlassian.com/v1/mcp',
    description: 'Create and manage Jira issues, epics, and sprints.',
    category: 'project-management',
    keywords: ['issues', 'tickets', 'sprint', 'project', 'jira', 'epics', 'agile']
  },
  {
    name: 'asana',
    url: 'https://mcp.asana.com/sse',
    description: 'Manage tasks, projects, and portfolios in Asana.',
    category: 'project-management',
    keywords: ['tasks', 'projects', 'asana', 'portfolio', 'tracking', 'workflow']
  },
  {
    name: 'amplitude',
    url: 'https://mcp.amplitude.com/mcp',
    description: 'Query product analytics: funnels, retention, cohorts, and events.',
    category: 'analytics',
    keywords: ['analytics', 'events', 'funnels', 'retention', 'metrics', 'amplitude', 'data']
  },
  {
    name: 'intercom',
    url: 'https://mcp.intercom.com/mcp',
    description: 'Access customer conversations, contacts, and help articles.',
    category: 'support',
    keywords: ['support', 'customers', 'conversations', 'helpdesk', 'intercom', 'chat']
  },
  {
    name: 'atlassian',
    url: 'https://mcp.atlassian.com/v1/mcp',
    description: 'Access Confluence pages, Jira issues, and Atlassian products.',
    category: 'productivity',
    keywords: ['confluence', 'wiki', 'jira', 'atlassian', 'docs', 'knowledge']
  },
  {
    name: 'hubspot',
    url: 'https://mcp.hubspot.com/mcp',
    description: 'Manage contacts, deals, and marketing campaigns in HubSpot.',
    category: 'crm',
    keywords: ['crm', 'contacts', 'deals', 'sales', 'marketing', 'hubspot', 'leads']
  },
  {
    name: 'zendesk',
    url: 'https://mcp.zendesk.com/mcp',
    description: 'Query and manage support tickets, users, and help center articles.',
    category: 'support',
    keywords: ['support', 'tickets', 'helpdesk', 'zendesk', 'customers', 'knowledge-base']
  },
  {
    name: 'pagerduty',
    url: 'https://mcp.pagerduty.com/mcp',
    description: 'Manage incidents, on-call schedules, and escalation policies.',
    category: 'observability',
    keywords: ['incidents', 'oncall', 'alerts', 'pagerduty', 'escalation', 'monitoring']
  },
  {
    name: 'datadog',
    url: 'https://mcp.datadoghq.com/mcp',
    description: 'Query metrics, traces, logs, and dashboards from Datadog.',
    category: 'observability',
    keywords: ['metrics', 'logs', 'traces', 'monitoring', 'datadog', 'dashboards', 'apm']
  },
  {
    name: 'grafana',
    url: 'https://mcp.grafana.com/mcp',
    description: 'Access Grafana dashboards, alerts, and data sources.',
    category: 'observability',
    keywords: ['dashboards', 'monitoring', 'grafana', 'alerts', 'visualization', 'metrics']
  },
  {
    name: 'google-drive',
    url: 'https://mcp.google.com/drive/mcp',
    description: 'Read and manage files, folders, and shared drives in Google Drive.',
    category: 'productivity',
    keywords: ['files', 'documents', 'sheets', 'drive', 'google', 'storage', 'sharing']
  },
  {
    name: 'google-calendar',
    url: 'https://mcp.google.com/calendar/mcp',
    description: 'Create and query calendar events, schedules, and availability.',
    category: 'productivity',
    keywords: ['calendar', 'events', 'scheduling', 'meetings', 'google', 'availability']
  },
  {
    name: 'salesforce',
    url: 'https://mcp.salesforce.com/mcp',
    description: 'Access CRM records, opportunities, accounts, and reports.',
    category: 'crm',
    keywords: ['crm', 'sales', 'accounts', 'opportunities', 'salesforce', 'leads', 'reports']
  },
  {
    name: 'stripe',
    url: 'https://mcp.stripe.com/mcp',
    description: 'Query payments, subscriptions, invoices, and customer billing.',
    category: 'payments',
    keywords: ['payments', 'billing', 'subscriptions', 'invoices', 'stripe', 'charges']
  },
  {
    name: 'twilio',
    url: 'https://mcp.twilio.com/mcp',
    description: 'Send SMS, make calls, and manage communication workflows.',
    category: 'communication',
    keywords: ['sms', 'calls', 'phone', 'twilio', 'messaging', 'voice', 'communication']
  }
]
