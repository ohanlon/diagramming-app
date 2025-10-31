/**
 * Connector-related commands for the Command pattern
 */

import { BaseCommand, type CommandJSON, type StateMutator } from './Command';
import type { Connector } from '../types';

/**
 * Command to add a connector
 */
export class AddConnectorCommand extends BaseCommand {
  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private connector: Connector
  ) {
    super();
  }

  execute(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            connectors: {
              ...currentSheet.connectors,
              [this.connector.id]: this.connector,
            },
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newConnectors = { ...currentSheet.connectors };
      delete newConnectors[this.connector.id];

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            connectors: newConnectors,
          },
        },
      };
    });
  }

  getDescription(): string {
    return 'Add connector';
  }

  toJSON(): CommandJSON {
    return {
      type: 'AddConnector',
      data: { connector: this.connector, activeSheetId: this.activeSheetId },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Command to delete connectors
 */
export class DeleteConnectorsCommand extends BaseCommand {
  private deletedConnectors: Connector[];

  constructor(
    private setState: StateMutator,
    private activeSheetId: string,
    private connectorIds: string[],
    private getCurrentConnectors: () => Record<string, Connector>
  ) {
    super();
    this.deletedConnectors = [];
  }

  execute(): void {
    // Store deleted connectors for undo
    const currentConnectors = this.getCurrentConnectors();
    this.deletedConnectors = this.connectorIds
      .map(id => currentConnectors[id])
      .filter((c): c is Connector => !!c);

    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newConnectors = { ...currentSheet.connectors };
      this.connectorIds.forEach(id => delete newConnectors[id]);

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            connectors: newConnectors,
            selectedConnectorIds: [],
          },
        },
      };
    });
  }

  undo(): void {
    this.setState((state) => {
      const currentSheet = state.sheets[this.activeSheetId];
      if (!currentSheet) return state;

      const newConnectors = { ...currentSheet.connectors };
      this.deletedConnectors.forEach(connector => {
        newConnectors[connector.id] = connector;
      });

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [this.activeSheetId]: {
            ...currentSheet,
            connectors: newConnectors,
          },
        },
      };
    });
  }

  getDescription(): string {
    return `Delete ${this.connectorIds.length} connector(s)`;
  }

  toJSON(): CommandJSON {
    return {
      type: 'DeleteConnectors',
      data: {
        connectors: this.deletedConnectors,
        activeSheetId: this.activeSheetId,
      },
      timestamp: this.timestamp,
    };
  }
}
