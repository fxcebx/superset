const $ = window.$ = require('jquery');
import React from 'react';
import Select from 'react-select';
import { Label, Button } from 'react-bootstrap';
import TableElement from './TableElement';
import DatabaseSelect from './DatabaseSelect';

const propTypes = {
  queryEditor: React.PropTypes.object.isRequired,
  tables: React.PropTypes.array,
  actions: React.PropTypes.object,
  networkOn: React.PropTypes.bool,
};

const defaultProps = {
  tables: [],
  networkOn: true,
  actions: {},
};

class SqlEditorLeftBar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      schemaLoading: false,
      schemaOptions: [],
      tableLoading: false,
      tableOptions: [],
      networkOn: true,
    };
  }
  componentWillMount() {
    this.fetchSchemas(this.props.queryEditor.dbId);
    this.fetchTables(this.props.queryEditor.dbId);
  }
  onChange(db) {
    const val = (db) ? db.value : null;
    this.setState({ schemaOptions: [] });
    this.props.actions.queryEditorSetDb(this.props.queryEditor, val);
    if (!(db)) {
      this.setState({ tableOptions: [] });
    } else {
      this.fetchTables(val, this.props.queryEditor.schema);
      this.fetchSchemas(val);
    }
  }
  resetState() {
    this.props.actions.resetState();
  }
  getTableNamesBySubStr(input, callback) {
    this.fetchTables(
        this.props.queryEditor.dbId,
        this.props.queryEditor.schema,
        input);
    callback(null, { options: this.state.tableOptions });
  }
  fetchTables(dbId, schema, substr) {
    if (dbId) {
      this.setState({ tableLoading: true, tableOptions: []});
      const url = `/superset/tables/${dbId}/${schema}/${substr}/`;
      $.get(url, (data) => {
        let tables = data.tables.map((s) => ({ value: s, label: s }));
        const views = data.views.map((s) => ({ value: s, label: '[view] ' + s }));
        this.setState({
          tableLoading: false,
          tableOptions: [...tables, ...views],
          tableLength: data.tables_length + data.views_length,
        });
      });
    }
  }
  changeSchema(schemaOpt) {
    const schema = (schemaOpt) ? schemaOpt.value : null;
    this.props.actions.queryEditorSetSchema(this.props.queryEditor, schema);
    this.fetchTables(this.props.queryEditor.dbId, schema);
  }
  fetchSchemas(dbId) {
    const actualDbId = dbId || this.props.queryEditor.dbId;
    if (actualDbId) {
      this.setState({ schemaLoading: true });
      const url = `/databasetablesasync/api/read?_flt_0_id=${actualDbId}`;
      $.get(url, (data) => {
        const schemas = data.result[0].all_schema_names;
        const schemaOptions = schemas.map((s) => ({ value: s, label: s }));
        this.setState({ schemaOptions });
        this.setState({ schemaLoading: false });
      });
    }
  }
  closePopover(ref) {
    this.refs[ref].hide();
  }
  changeTable(tableOpt) {
    const tableName = tableOpt.value;
    const qe = this.props.queryEditor;

    this.setState({ tableLoading: true });
    this.props.actions.addTable(qe, tableName);
    this.setState({ tableLoading: false });
    this.fetchTables(
        this.props.queryEditor.dbId, this.props.queryEditor.schema)
  }
  render() {
    let networkAlert = null;
    if (!this.props.networkOn) {
      networkAlert = <p><Label bsStyle="danger">OFFLINE</Label></p>;
    }
    const shouldShowReset = window.location.search === '?reset=1';
    return (
      <div className="scrollbar-container">
        <div className="clearfix sql-toolbar scrollbar-content">
          {networkAlert}
          <div>
            <DatabaseSelect
              onChange={this.onChange.bind(this)}
              databaseId={this.props.queryEditor.dbId}
              actions={this.props.actions}
              valueRenderer={(o) => (
                <div>
                  <span className="text-muted">Database:</span> {o.label}
                </div>
              )}
            />
          </div>
          <div className="m-t-5">
            <Select
              name="select-schema"
              placeholder={`Select a schema (${this.state.schemaOptions.length})`}
              options={this.state.schemaOptions}
              value={this.props.queryEditor.schema}
              valueRenderer={(o) => (
                <div>
                  <span className="text-muted">Schema:</span> {o.label}
                </div>
              )}
              isLoading={this.state.schemaLoading}
              autosize={false}
              onChange={this.changeSchema.bind(this)}
            />
          </div>
          <div className="m-t-5">
            {this.props.queryEditor.schema && <Select
              name="select-table"
              ref="selectTable"
              isLoading={this.state.tableLoading}
              placeholder={`Add a table (${this.state.tableOptions.length})`}
              autosize={false}
              onChange={this.changeTable.bind(this)}
              options={this.state.tableOptions}
            />}
            {!this.props.queryEditor.schema &&  <Select.Async
              name="async-select-table"
              ref="selectTable"
              isLoading={this.state.tableLoading}
              placeholder={`Add a table (${this.state.tableLength})`}
              autosize={false}
              onChange={this.changeTable.bind(this)}
              options={this.state.tableOptions}
              loadOptions={this.getTableNamesBySubStr.bind(this)}
            />}
          </div>
          <hr />
          <div className="m-t-5">
            {this.props.tables.map((table) => (
              <TableElement
                table={table}
                key={table.id}
                actions={this.props.actions}
              />
            ))}
          </div>
          {shouldShowReset &&
            <Button bsSize="small" bsStyle="danger" onClick={this.resetState.bind(this)}>
              <i className="fa fa-bomb" /> Reset State
            </Button>
          }
        </div>
      </div>
    );
  }
}
SqlEditorLeftBar.propTypes = propTypes;
SqlEditorLeftBar.defaultProps = defaultProps;

export default SqlEditorLeftBar;
