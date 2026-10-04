import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ImapService } from '../services/imap-service.js';
import { AccountManager } from '../services/account-manager.js';
import { z } from 'zod';

export function folderTools(
  server: McpServer,
  imapService: ImapService,
  accountManager: AccountManager
): void {
  // List folders tool
  server.registerTool('imap_list_folders', {
    description: 'List all folders/mailboxes in an IMAP account',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
    }
  }, async ({ accountId }) => {
    const folders = await imapService.listFolders(accountId);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          folders: folders.map(folder => ({
            name: folder.name,
            delimiter: folder.delimiter,
            attributes: folder.attributes,
            hasChildren: !!folder.children && folder.children.length > 0,
          })),
        }, null, 2)
      }]
    };
  });

  // Get folder status tool
  server.registerTool('imap_folder_status', {
    description: 'Get status information about a folder',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
      folder: z.string().describe('Folder name'),
    }
  }, async ({ accountId, folder }) => {
    const box = await imapService.selectFolder(accountId, folder);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          folder: folder,
          messages: {
            total: box.messages.total,
            new: box.messages.new,
            unseen: box.messages.unseen || 0,
          },
          uidvalidity: box.uidvalidity,
          uidnext: box.uidnext,
          flags: box.flags,
          permanentFlags: box.permanentFlags,
        }, null, 2)
      }]
    };
  });

  // Get unread count tool (uses single LIST+STATUS command — no N+1)
  server.registerTool('imap_get_unread_count', {
    description: 'Get the count of unread emails in specified folders (single IMAP round-trip)',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
      folders: z.array(z.string()).optional().describe('List of folders to check (default: all with unread)'),
    }
  }, async ({ accountId, folders }) => {
    const result = await imapService.getUnreadCountBatch(accountId, folders);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  });

  // Create folder tool
  server.registerTool('imap_create_folder', {
    description: 'Create a new IMAP folder/mailbox (use / as delimiter for subfolders, e.g. "_Mia/Wichtig")',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
      path: z.string().describe('Folder path to create'),
    }
  }, async ({ accountId, path }) => {
    const result = await imapService.createFolder(accountId, path);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  });

  // Delete folder tool
  server.registerTool('imap_delete_folder', {
    description: 'Delete an IMAP folder/mailbox (must be empty)',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
      path: z.string().describe('Folder path to delete'),
    }
  }, async ({ accountId, path }) => {
    const result = await imapService.deleteFolder(accountId, path);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  });

  // Rename folder tool
  server.registerTool('imap_rename_folder', {
    description: 'Rename or move an IMAP folder',
    inputSchema: {
      accountId: z.string().describe('Account ID'),
      path: z.string().describe('Current folder path'),
      newPath: z.string().describe('New folder path'),
    }
  }, async ({ accountId, path, newPath }) => {
    const result = await imapService.renameFolder(accountId, path, newPath);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  });
}