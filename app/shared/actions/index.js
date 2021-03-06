/**
 * Redux actions
 * @flow
 */

import { push } from 'react-router-redux';
import { createAliasedAction } from 'electron-redux';
import Papa from 'papaparse';
import buildProjectMain from '../../main/build-project';
import postBuild from '../../main/post-build';

export const LOAD_TEMPLATE_DATA = 'LOAD_TEMPLATE_DATA';
export const SELECT_CHART_TEMPLATE = 'SELECT_CHART_TEMPLATE';
export const LOAD_USER_DATA = 'LOAD_USER_DATA';
export const BUILD_PROJECT = 'BUILD_PROJECT';
export const POST_BUILD_PROJECT = 'POST_BUILD_PROJECT';
export const SYNC_REPO = 'SYNC_REPO';

export const syncRepo = createAliasedAction(SYNC_REPO, status => ({
  type: SYNC_REPO,
  payload: status
}));

export const loadTemplateData = createAliasedAction(
  LOAD_TEMPLATE_DATA,
  ({ templates, categories, docsPath }) => ({
    type: LOAD_TEMPLATE_DATA,
    templates,
    categories,
    docsPath
  })
);

export const selectChartTemplate = templateName => ({
  type: SELECT_CHART_TEMPLATE,
  selectedTemplate: templateName
});

export const loadUserData = (files, selectedTemplate) => dispatch =>
  new Promise((resolve, reject) => {
    Papa.parse(files[0], {
      header: false,
      complete: ({ data: userData }) => resolve(userData),
      error: err => reject(err)
    });
  })
    .then(result =>
      dispatch({
        type: LOAD_USER_DATA,
        userData: result
      })
    )
    .then(({ userData }) => {
      if (userData && userData.length > 0) {
        const headerRow = userData[0];

        if (!headerRow.includes('highlight')) {
          headerRow.push('highlight');
        }

        if (!headerRow.includes('annotate')) {
          headerRow.push('annotate');
        }

        const parsed = userData
          .slice(1)
          .filter(d => d.join('') !== '')
          .map((el) => {
            const origLen = el.length;
            el.length = headerRow.length; // eslint-disable-line no-param-reassign
            return el.fill('', origLen);
          }, []);

        return {
          sheetData: [
            headerRow,
            ...parsed,
          ],
          selectedTemplate
        };
      }
      return null;
    })
    .then(({ sheetData }) => dispatch(buildProject(selectedTemplate, sheetData)));

export const buildProject = createAliasedAction(
  BUILD_PROJECT,
  (chartType, spreadsheetData) => dispatch =>
    buildProjectMain(chartType, spreadsheetData)
      .then(postBuild)
      .then(payload =>
        dispatch({
          type: BUILD_PROJECT,
          payload
        })
      )
      .then(() => dispatch(push('/')))
);
