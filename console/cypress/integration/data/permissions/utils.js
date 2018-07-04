import {
  getElementFromAlias,
  getTableName,
  getColName,
  queryTypes,
  makeDataAPIOptions,
} from '../../../helpers/dataHelpers';

import { validatePermission } from '../../validators/validators';

export const savePermission = () => {
  cy.get('button')
    .contains('Save permissions')
    .click();
  cy.wait(5000);
  // Check for success notif
  cy.get('[class=notification-title]').contains('Permissions updated');
};

export const permNoCheck = (tableName, query, first) => {
  // first is the insert in case of tables and select in case of views
  // During first, the gridcell will not be named properly;
  // click on the query type to edit permission
  cy.get(
    getElementFromAlias(`${query === first ? '' : 'role0'}-${query}`)
  ).click();
  // check the custom check textbox
  cy.get(getElementFromAlias('without-checks')).click();
  // set filter { }
  // Toggle all columns in case
  if (query === 'select' || query === 'update') {
    cy.get('span')
      .contains('Toggle all')
      .click();
  }
  // Save
  savePermission();
  // Validate
  validatePermission(tableName, 'role0', query, 'none', 'success', null, true);
  // Do not allow users to make upset queries in case of Insert
  if (query === 'insert') {
    // Reopen insert permission
    cy.get(getElementFromAlias('role0-insert')).click();
    cy.get('span')
      .contains('upsert queries')
      .click();
    // Save
    savePermission();
    // Validate
    validatePermission(
      tableName,
      'role0',
      query,
      'none',
      'success',
      null,
      false
    );
  }
};

export const permCustomCheck = (tableName, query) => {
  // click on the query type to edit permission
  cy.get(getElementFromAlias(`role0-${query}`)).click();
  // check the without checks textbox
  cy.get(getElementFromAlias('custom-check')).click();
  // Select column
  cy.get('select').select(getColName(0));
  // Select operator
  cy.get('select')
    .last()
    .select(`${getColName(0)}._eq`);
  // Set filter to 1
  cy.get(getElementFromAlias('perm-check-textbox')).type('1');
  // Save
  savePermission();
  // Validate
  validatePermission(
    tableName,
    'role0',
    query,
    'custom',
    'success',
    [0, 1, 2].map(i => getColName(i)),
    false
  );
  // Do not allow users to make upset queries in case of Insert
};

export const permRemove = (tableName, query) => {
  // click on the query type to edit permission
  cy.get(getElementFromAlias(`role0-${query}`)).click();
  // Remove permission
  cy.get('button')
    .contains('Remove all access')
    .click();
  cy.wait(5000);
  // Check for notif
  cy.get('[class=notification-title]').contains('Permissions deleted');
  cy.wait(5000);
  // Validate
  validatePermission(tableName, 'role0', query, 'custom', 'failure');
};

export const testPermissions = (tableName, check, isView) => {
  let allQueryTypes = queryTypes;
  if (isView) {
    allQueryTypes = ['select'];
  }
  const first = isView ? 'select' : 'insert';
  if (check === 'none') {
    allQueryTypes.forEach(query => {
      permNoCheck(tableName, query, first);
    });
  } else {
    allQueryTypes.forEach(query => {
      permCustomCheck(tableName, query, first);
    });
  }
};

export const trackView = () => {
  // track view
  cy.get('a')
    .contains('Data')
    .click();
  cy.wait(7000);
  cy.get(getElementFromAlias(`add-track-table-${getTableName(1)}`)).click();
  cy.wait(10000);
  // Move to permissions
  cy.get('a')
    .contains('Permissions')
    .click();
};

export const createView = (viewName, tableName) => {
  const reqBody = {
    type: 'run_sql',
    args: {
      sql: `create view ${viewName} as select * from ${tableName}`,
    },
  };
  cy.window().then(win => {
    const { __env } = win;
    const requestOptions = makeDataAPIOptions(
      __env.dataApiUrl,
      __env.accessKey,
      reqBody
    );
    cy.request(requestOptions);
  });
};