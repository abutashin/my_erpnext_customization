(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/grid_row_form.js
  var GridRowForm = class {
    constructor(opts) {
      $.extend(this, opts);
      this.wrapper = $('<div class="form-in-grid"></div>').appendTo(this.row.wrapper);
    }
    render() {
      var me = this;
      this.make_form();
      this.form_area.empty();
      frappe.utils.scroll_to(0, false, 0, this.wrapper.find(".grid-form-body"));
      this.layout = new frappe.ui.form.Layout({
        fields: this.row.docfields,
        body: this.form_area,
        no_submit_on_enter: true,
        frm: this.row.frm,
        grid: this.row.grid,
        grid_row: this.row,
        grid_row_form: this
      });
      this.layout.make();
      this.fields = this.layout.fields;
      this.fields_dict = this.layout.fields_dict;
      this.layout.refresh(this.row.doc);
      for (var fieldname in this.row.grid.fieldinfo || {}) {
        var fi = this.row.grid.fieldinfo[fieldname];
        $.extend(me.fields_dict[fieldname], fi);
      }
      this.toggle_add_delete_button_display(this.wrapper);
      this.row.grid.open_grid_row = this;
      this.set_focus();
    }
    make_form() {
      if (!this.form_area) {
        let template = `<div class="grid-form-heading">
				<div class="toolbar grid-header-toolbar">
					<span class="panel-title">
						${__("Editing Row")} #<span class="grid-form-row-index"></span></span>
					<span class="row-actions">
						<button class="btn btn-secondary btn-sm pull-right grid-collapse-row">
							${frappe.utils.icon("down")}
						</button>
						<button class="btn btn-secondary btn-sm pull-right grid-move-row hidden-xs">
							${__("Move")}</button>
						<button class="btn btn-secondary btn-sm pull-right grid-duplicate-row hidden-xs">
							${frappe.utils.icon("duplicate")}
							${__("Duplicate")}
						</button>
						<button class="btn btn-secondary btn-sm pull-right grid-insert-row hidden-xs">
							${__("Insert Above")}</button>
						<button class="btn btn-secondary btn-sm pull-right grid-insert-row-below hidden-xs">
							${__("Insert Below")}</button>
						<button class="btn btn-danger btn-sm pull-right grid-delete-row">
							${frappe.utils.icon("delete")}
						</button>
					</span>
				</div>
			</div>
			<div class="grid-form-body">
				<div class="form-area"></div>
				<div class="grid-footer-toolbar hidden-xs flex justify-between">
					<div class="grid-shortcuts">
						<span> ${frappe.utils.icon("keyboard", "md")} </span>
						<span class="text-medium"> ${__("Shortcuts")}: </span>
						<kbd>${__("Ctrl + Up")}</kbd> . <kbd>${__("Ctrl + Down")}</kbd> . <kbd>${__("ESC")}</kbd>
					</div>
					<button class="btn btn-secondary btn-sm pull-right grid-append-row">
						${__("Insert Below")}
					</button>
				</div>
			</div>`;
        $(template).appendTo(this.wrapper);
        this.form_area = this.wrapper.find(".form-area");
        this.row.set_row_index();
        this.set_form_events();
      }
    }
    set_form_events() {
      var me = this;
      this.wrapper.find(".grid-delete-row").on("click", function() {
        me.row.remove();
        return false;
      });
      this.wrapper.find(".grid-insert-row").on("click", function() {
        me.row.insert(true);
        return false;
      });
      this.wrapper.find(".grid-insert-row-below").on("click", function() {
        me.row.insert(true, true);
        return false;
      });
      this.wrapper.find(".grid-duplicate-row").on("click", function() {
        me.row.insert(true, true, true);
        return false;
      });
      this.wrapper.find(".grid-move-row").on("click", function() {
        me.row.move();
        return false;
      });
      this.wrapper.find(".grid-append-row").on("click", function() {
        me.row.toggle_view(false);
        me.row.grid.add_new_row(me.row.doc.idx + 1, null, true);
        return false;
      });
      this.wrapper.find(".grid-form-heading, .grid-footer-toolbar").on("click", function() {
        me.row.toggle_view();
        return false;
      });
    }
    toggle_add_delete_button_display($parent) {
      $parent.find(".row-actions, .grid-append-row").toggle(this.row.grid.is_editable());
    }
    refresh_field(fieldname) {
      const field = this.fields_dict[fieldname];
      if (!field)
        return;
      field.docname = this.row.doc.name;
      field.refresh();
      this.layout && this.layout.refresh_dependency();
    }
    set_focus() {
      var me = this;
      setTimeout(function() {
        if (me.row.frm && me.row.frm.doc.docstatus === 0 || !me.row.frm) {
          var first = me.form_area.find("input:first");
          if (first.length && !["Date", "Datetime", "Time"].includes(first.attr("data-fieldtype"))) {
            try {
              first.get(0).focus();
            } catch (e) {
            }
          }
        }
      }, 500);
    }
  };

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/grid_row.js
  var GridRow = class {
    constructor(opts) {
      this.on_grid_fields_dict = {};
      this.on_grid_fields = [];
      $.extend(this, opts);
      this.set_docfields();
      this.columns = {};
      this.columns_list = [];
      this.row_check_html = '<input type="checkbox" class="grid-row-check">';
      this.make();
    }
    make() {
      let me = this;
      let render_row = true;
      this.wrapper = $('<div class="grid-row"></div>');
      this.row = $('<div class="data-row row"></div>').appendTo(this.wrapper).on("click", function(e) {
        if ($(e.target).hasClass("grid-row-check") || $(e.target).hasClass("row-index") || $(e.target).parent().hasClass("row-index")) {
          return;
        }
        if (me.grid.allow_on_grid_editing() && me.grid.is_editable()) {
        } else {
          me.toggle_view();
          return false;
        }
      });
      if (this.grid.template && !this.grid.meta.editable_grid) {
        this.render_template();
      } else {
        render_row = this.render_row();
      }
      if (!render_row)
        return;
      this.set_data();
      this.wrapper.appendTo(this.parent);
    }
    set_docfields(update = false) {
      if (this.doc && this.parent_df.options) {
        frappe.meta.make_docfield_copy_for(
          this.parent_df.options,
          this.doc.name,
          this.docfields
        );
        const docfields = frappe.meta.get_docfields(this.parent_df.options, this.doc.name);
        if (update) {
          this.docfields.forEach((df) => {
            Object.assign(
              df,
              docfields.find((d) => d.fieldname === df.fieldname)
            );
          });
        } else {
          this.docfields = docfields;
        }
      }
    }
    set_data() {
      this.wrapper.data({
        grid_row: this,
        doc: this.doc || ""
      });
    }
    set_row_index() {
      if (this.doc) {
        this.wrapper.attr("data-name", this.doc.name).attr("data-idx", this.doc.idx).find(".row-index span, .grid-form-row-index").html(this.doc.idx);
      }
    }
    select(checked) {
      this.doc.__checked = checked ? 1 : 0;
    }
    refresh_check() {
      this.wrapper.find(".grid-row-check").prop("checked", this.doc ? !!this.doc.__checked : false);
      this.grid.refresh_remove_rows_button();
    }
    remove() {
      var me = this;
      if (this.grid.is_editable()) {
        if (this.frm) {
          if (this.get_open_form()) {
            this.hide_form();
          }
          frappe.run_serially([
            () => {
              return this.frm.script_manager.trigger(
                "before_" + this.grid.df.fieldname + "_remove",
                this.doc.doctype,
                this.doc.name
              );
            },
            () => {
              frappe.model.clear_doc(this.doc.doctype, this.doc.name);
              this.frm.script_manager.trigger(
                this.grid.df.fieldname + "_remove",
                this.doc.doctype,
                this.doc.name
              );
              this.frm.dirty();
              this.grid.refresh();
            }
          ]).catch((e) => {
            console.trace(e);
          });
        } else {
          let data = null;
          if (this.grid.df.get_data) {
            data = this.grid.df.get_data();
          } else {
            data = this.grid.df.data;
          }
          const index = data.findIndex((d) => d.name === me.doc.name);
          if (index > -1) {
            data.splice(index, 1);
          }
          data.forEach(function(d, i) {
            d.idx = i + 1;
          });
          this.grid.refresh();
        }
      }
    }
    insert(show, below, duplicate) {
      var idx = this.doc.idx;
      var copy_doc = duplicate ? this.doc : null;
      if (below)
        idx++;
      this.toggle_view(false);
      this.grid.add_new_row(idx, null, show, copy_doc);
    }
    move() {
      var me = this;
      frappe.prompt(
        {
          fieldname: "move_to",
          label: __("Move to Row Number"),
          fieldtype: "Int",
          reqd: 1,
          default: this.doc.idx
        },
        function(values) {
          if (me.doc._sortable === false) {
            frappe.msgprint(__("Cannot move row"));
            return;
          }
          let data = me.grid.get_data();
          data.move(me.doc.idx - 1, values.move_to - 1);
          for (let i = 0; i < data.length; i++) {
            data[i].idx = i + 1;
          }
          me.toggle_view(false);
          me.grid.refresh();
          $(me.frm.wrapper).trigger("grid-move-row", [me.frm, me]);
        },
        __("Move To"),
        "Update"
      );
    }
    refresh() {
      if (this.frm && this.doc && this.doc.__islocal) {
        this.set_docfields(true);
      }
      if (this.frm && this.doc) {
        this.doc = locals[this.doc.doctype][this.doc.name];
      }
      if (this.grid.template && !this.grid.meta.editable_grid) {
        this.render_template();
      } else {
        this.render_row(true);
      }
      if (this.grid_form) {
        this.grid_form.layout && this.grid_form.layout.refresh(this.doc);
      }
    }
    render_template() {
      this.set_row_index();
      if (this.row_display) {
        this.row_display.remove();
      }
      if (!this.row_index) {
        this.row_index = $(
          `<div class="template-row-index">${this.row_check_html}<span></span></div>`
        ).appendTo(this.row);
      }
      if (this.doc) {
        this.row_index.find("span").html(this.doc.idx);
      }
      this.row_display = $('<div class="row-data sortable-handle template-row"></div>').appendTo(this.row).html(
        frappe.render(this.grid.template, {
          doc: this.doc ? frappe.get_format_helper(this.doc) : null,
          frm: this.frm,
          row: this
        })
      );
    }
    render_row(refresh) {
      if (this.show_search && !this.show_search_row())
        return;
      let me = this;
      this.set_row_index();
      if (!this.row_index && !this.show_search) {
        const txt = this.doc ? this.doc.idx : __("No.", null, "Title of the 'row number' column");
        this.row_check = $(
          `<div class="row-check sortable-handle col">
					${this.row_check_html}
				</div>`
        ).appendTo(this.row);
        this.row_index = $(
          `<div class="row-index sortable-handle col">
					<span>${txt}</span>
				</div>`
        ).appendTo(this.row).on("click", function(e) {
          if (!$(e.target).hasClass("grid-row-check")) {
            me.toggle_view();
          }
        });
      } else if (this.show_search) {
        this.row_check = $(`<div class="row-check col search"></div>`).appendTo(this.row);
        this.row_index = $(
          `<div class="row-index col search">
					<input type="text" class="form-control input-xs text-center" >
				</div>`
        ).appendTo(this.row);
        this.row_index.find("input").on(
          "keyup",
          frappe.utils.debounce((e) => {
            let df = {
              fieldtype: "Sr No"
            };
            this.grid.filter["row-index"] = {
              df,
              value: e.target.value
            };
            if (e.target.value == "") {
              delete this.grid.filter["row-index"];
            }
            this.grid.grid_sortable.option(
              "disabled",
              Object.keys(this.grid.filter).length !== 0
            );
            this.grid.prevent_build = true;
            me.grid.refresh();
            this.grid.prevent_build = false;
          }, 500)
        );
        frappe.utils.only_allow_num_decimal(this.row_index.find("input"));
      }
      this.setup_columns();
      this.add_open_form_button();
      this.add_column_configure_button();
      this.refresh_check();
      if (this.frm && this.doc) {
        $(this.frm.wrapper).trigger("grid-row-render", [this]);
      }
      return true;
    }
    make_editable() {
      this.row.toggleClass("editable-row", this.grid.is_editable());
    }
    is_too_small() {
      return this.row.width() ? this.row.width() < 300 : false;
    }
    add_open_form_button() {
      var me = this;
      if (this.doc && !this.grid.df.in_place_edit) {
        if (!this.open_form_button) {
          this.open_form_button = $('<div class="col"></div>').appendTo(this.row);
          if (!this.configure_columns) {
            const edit_msg = __("Edit", "", "Edit grid row");
            this.open_form_button = $(`
						<div class="btn-open-row" data-toggle="tooltip" data-placement="right" title="${edit_msg}">
							<a>${frappe.utils.icon("edit", "xs")}</a>
						</div>
					`).appendTo(this.open_form_button).on("click", function() {
              me.toggle_view();
              return false;
            });
            this.open_form_button.tooltip({ delay: { show: 600, hide: 100 } });
          }
          if (this.is_too_small()) {
            this.open_form_button.css({ "margin-right": "-2px" });
          }
        }
      }
    }
    add_column_configure_button() {
      if (this.grid.df.in_place_edit && !this.frm)
        return;
      if (this.configure_columns && this.frm) {
        this.configure_columns_button = $(`
				<div class="col grid-static-col d-flex justify-content-center" style="cursor: pointer;">
					<a>${frappe.utils.icon("setting-gear", "sm", "", "filter: opacity(0.5)")}</a>
				</div>
			`).appendTo(this.row).on("click", () => {
          this.configure_dialog_for_columns_selector();
        });
      } else if (this.configure_columns && !this.frm) {
        this.configure_columns_button = $(`
				<div class="col grid-static-col"></div>
			`).appendTo(this.row);
      }
    }
    configure_dialog_for_columns_selector() {
      this.grid_settings_dialog = new frappe.ui.Dialog({
        title: __("Configure Columns"),
        fields: [
          {
            fieldtype: "HTML",
            fieldname: "fields_html"
          }
        ]
      });
      this.grid.setup_visible_columns();
      this.setup_columns_for_dialog();
      this.prepare_wrapper_for_columns();
      this.render_selected_columns();
      this.grid_settings_dialog.show();
      $(this.fields_html_wrapper).find(".add-new-fields").click(() => {
        this.column_selector_for_dialog();
      });
      this.grid_settings_dialog.set_primary_action(__("Update"), () => {
        this.validate_columns_width();
        this.columns = {};
        this.update_user_settings_for_grid();
        this.grid_settings_dialog.hide();
      });
      this.grid_settings_dialog.set_secondary_action_label(__("Reset to default"));
      this.grid_settings_dialog.set_secondary_action(() => {
        this.reset_user_settings_for_grid();
        this.grid_settings_dialog.hide();
      });
    }
    setup_columns_for_dialog() {
      this.selected_columns_for_grid = [];
      this.grid.visible_columns.forEach((row) => {
        this.selected_columns_for_grid.push({
          fieldname: row[0].fieldname,
          columns: row[0].columns || row[0].colsize
        });
      });
    }
    prepare_wrapper_for_columns() {
      this.fields_html_wrapper = this.grid_settings_dialog.get_field("fields_html").$wrapper[0];
      $(`
			<div class='form-group'>
				<div class='row' style='margin:0px; margin-bottom:10px;'>
					<div class='col-6 col-md-8'>
						${__("Fieldname").bold()}
					</div>
					<div class='col-6 col-md-4' style='padding-left:5px;'>
						${__("Column Width").bold()}
					</div>
				</div>
				<div class='control-input-wrapper selected-fields'>
				</div>
				<p class='help-box small text-muted'>
					<a class='add-new-fields text-muted'>
						+ ${__("Add / Remove Columns")}
					</a>
				</p>
			</div>
		`).appendTo(this.fields_html_wrapper);
    }
    column_selector_for_dialog() {
      let docfields = this.prepare_columns_for_dialog(
        this.selected_columns_for_grid.map((field) => field.fieldname)
      );
      let d = new frappe.ui.Dialog({
        title: __("{0} Fields", [__(this.grid.doctype)]),
        fields: [
          {
            label: __("Select Fields"),
            fieldtype: "MultiCheck",
            fieldname: "fields",
            options: docfields,
            columns: 2,
            sort_options: false
          }
        ]
      });
      d.set_primary_action(__("Add"), () => {
        let selected_fields = d.get_values().fields;
        this.selected_columns_for_grid = [];
        if (selected_fields) {
          selected_fields.forEach((selected_column) => {
            let docfield = frappe.meta.get_docfield(this.grid.doctype, selected_column);
            this.grid.update_default_colsize(docfield);
            this.selected_columns_for_grid.push({
              fieldname: selected_column,
              columns: docfield.columns || docfield.colsize
            });
          });
          this.render_selected_columns();
          d.hide();
        }
      });
      d.show();
    }
    prepare_columns_for_dialog(selected_fields) {
      let fields = [];
      const blocked_fields = frappe.model.no_value_type;
      const always_allow = ["Button"];
      const show_field = (f) => always_allow.includes(f) || !blocked_fields.includes(f);
      selected_fields.forEach((selectedField) => {
        const selectedColumn = this.docfields.find(
          (column) => column.fieldname === selectedField
        );
        if (selectedColumn && !selectedColumn.hidden && show_field(selectedColumn.fieldtype)) {
          fields.push({
            label: selectedColumn.label,
            value: selectedColumn.fieldname,
            checked: true
          });
        }
      });
      this.docfields.forEach((column) => {
        if (!selected_fields.includes(column.fieldname) && !column.hidden && show_field(column.fieldtype)) {
          fields.push({
            label: column.label,
            value: column.fieldname,
            checked: false
          });
        }
      });
      return fields;
    }
    render_selected_columns() {
      let fields = "";
      if (this.selected_columns_for_grid) {
        this.selected_columns_for_grid.forEach((d) => {
          let docfield = frappe.meta.get_docfield(this.grid.doctype, d.fieldname);
          fields += `
					<div class='control-input flex align-center form-control fields_order sortable-handle sortable'
						style='display: block; margin-bottom: 5px; padding: 0 8px; cursor: pointer; height: 32px;' data-fieldname='${docfield.fieldname}'
						data-label='${docfield.label}' data-type='${docfield.fieldtype}'>

						<div class='row'>
							<div class='col-1' style='padding-top: 4px;'>
								<a style='cursor: grabbing;'>${frappe.utils.icon("drag", "xs")}</a>
							</div>
							<div class='col-6 col-md-8' style='padding-right:0px; padding-top: 5px;'>
								${__(docfield.label, null, docfield.parent)}
							</div>
							<div class='col-3 col-md-2' style='padding-left:0px; padding-top: 2px; margin-top:-2px;' title='${__(
            "Columns"
          )}'>
								<input class='form-control column-width my-1 input-xs text-right'
								style='height: 24px; max-width: 80px; background: var(--bg-color);'
									value='${docfield.columns || cint(d.columns)}'
									data-fieldname='${docfield.fieldname}' style='background-color: var(--modal-bg); display: inline'>
							</div>
							<div class='col-1' style='padding-top: 3px;'>
								<a class='text-muted remove-field' data-fieldname='${docfield.fieldname}'>
									<i class='fa fa-trash-o' aria-hidden='true'></i>
								</a>
							</div>
						</div>
					</div>`;
        });
      }
      $(this.fields_html_wrapper).find(".selected-fields").html(fields);
      this.prepare_handler_for_sort();
      this.select_on_focus();
      this.update_column_width();
      this.remove_selected_column();
    }
    prepare_handler_for_sort() {
      new Sortable($(this.fields_html_wrapper).find(".selected-fields")[0], {
        handle: ".sortable-handle",
        draggable: ".sortable",
        onUpdate: () => {
          this.sort_columns();
        }
      });
    }
    sort_columns() {
      this.selected_columns_for_grid = [];
      let columns = $(this.fields_html_wrapper).find(".fields_order") || [];
      columns.each((idx) => {
        this.selected_columns_for_grid.push({
          fieldname: $(columns[idx]).attr("data-fieldname"),
          columns: cint($(columns[idx]).find(".column-width").attr("value"))
        });
      });
    }
    select_on_focus() {
      $(this.fields_html_wrapper).find(".column-width").click((event) => {
        $(event.target).select();
      });
    }
    update_column_width() {
      $(this.fields_html_wrapper).find(".column-width").change((event) => {
        if (cint(event.target.value) === 0) {
          event.target.value = cint(event.target.defaultValue);
          frappe.throw(__("Column width cannot be zero."));
        }
        this.selected_columns_for_grid.forEach((row) => {
          if (row.fieldname === event.target.dataset.fieldname) {
            row.columns = cint(event.target.value);
            event.target.defaultValue = cint(event.target.value);
          }
        });
      });
    }
    validate_columns_width() {
      let total_column_width = 0;
      this.selected_columns_for_grid.forEach((row) => {
        if (row.columns && row.columns > 0) {
          total_column_width += cint(row.columns);
        }
      });
    }
    remove_selected_column() {
      $(this.fields_html_wrapper).find(".remove-field").click((event) => {
        let fieldname = event.currentTarget.dataset.fieldname;
        let selected_columns_for_grid = this.selected_columns_for_grid.filter((row) => {
          return row.fieldname !== fieldname;
        });
        if (selected_columns_for_grid && selected_columns_for_grid.length === 0) {
          frappe.throw(__("At least one column is required to show in the grid."));
        }
        this.selected_columns_for_grid = selected_columns_for_grid;
        $(this.fields_html_wrapper).find(`[data-fieldname="${fieldname}"]`).remove();
      });
    }
    update_user_settings_for_grid() {
      if (!this.selected_columns_for_grid || !this.frm) {
        return;
      }
      let value = {};
      value[this.grid.doctype] = this.selected_columns_for_grid;
      frappe.model.user_settings.save(this.frm.doctype, "GridView", value).then((r) => {
        frappe.model.user_settings[this.frm.doctype] = r.message || r;
        this.grid.reset_grid();
      });
    }
    reset_user_settings_for_grid() {
      frappe.model.user_settings.save(this.frm.doctype, "GridView", null).then((r) => {
        frappe.model.user_settings[this.frm.doctype] = r.message || r;
        this.grid.reset_grid();
      });
    }
    setup_columns() {
      this.focus_set = false;
      this.search_columns = {};
      this.grid.setup_visible_columns();
      let fields = this.grid.user_defined_columns && this.grid.user_defined_columns.length > 0 ? this.grid.user_defined_columns : this.docfields;
      this.grid.visible_columns.forEach((col, ci) => {
        let df = fields.find((field) => (field == null ? void 0 : field.fieldname) === col[0].fieldname);
        this.set_dependant_property(df);
        let colsize = col[1];
        let txt = this.doc ? frappe.format(this.doc[df.fieldname], df, null, this.doc) : __(df.label, null, df.parent);
        if (this.doc && df.fieldtype === "Select") {
          txt = __(txt);
        }
        let column;
        if (!this.columns[df.fieldname] && !this.show_search) {
          column = this.make_column(df, colsize, txt, ci);
        } else if (!this.columns[df.fieldname] && this.show_search) {
          column = this.make_search_column(df, colsize);
        } else {
          column = this.columns[df.fieldname];
          this.refresh_field(df.fieldname, txt);
        }
        if (this.doc) {
          if (df.reqd && !txt) {
            column.addClass("error");
          }
          if (column.is_invalid) {
            column.addClass("invalid");
          } else if (df.reqd || df.bold) {
            column.addClass("bold");
          }
        }
      });
      if (this.show_search) {
        $(`<div class="col grid-static-col search"></div>`).appendTo(this.row);
      }
    }
    set_dependant_property(df) {
      if (!df.reqd && df.mandatory_depends_on && this.evaluate_depends_on_value(df.mandatory_depends_on)) {
        df.reqd = 1;
      }
      if (!df.read_only && df.read_only_depends_on && this.evaluate_depends_on_value(df.read_only_depends_on)) {
        df.read_only = 1;
      }
    }
    evaluate_depends_on_value(expression) {
      let out = null;
      let doc = this.doc;
      if (!doc)
        return;
      let parent = this.frm ? this.frm.doc : this.doc || null;
      if (typeof expression === "boolean") {
        out = expression;
      } else if (typeof expression === "function") {
        out = expression(doc);
      } else if (expression.substr(0, 5) == "eval:") {
        try {
          out = frappe.utils.eval(expression.substr(5), { doc, parent });
          if (parent && parent.istable && expression.includes("is_submittable")) {
            out = true;
          }
        } catch (e) {
          frappe.throw(__('Invalid "depends_on" expression'));
        }
      } else if (expression.substr(0, 3) == "fn:" && this.frm) {
        out = this.frm.script_manager.trigger(
          expression.substr(3),
          this.doctype,
          this.docname
        );
      } else {
        var value = doc[expression];
        if ($.isArray(value)) {
          out = !!value.length;
        } else {
          out = !!value;
        }
      }
      return out;
    }
    show_search_row() {
      var _a, _b;
      this.show_search = this.show_search && (((_b = (_a = this.grid) == null ? void 0 : _a.data) == null ? void 0 : _b.length) >= 20 || this.grid.filter_applied);
      !this.show_search && this.wrapper.remove();
      return this.show_search;
    }
    make_search_column(df, colsize) {
      let title = "";
      let input_class = "";
      let is_disabled = "";
      if (["Text", "Small Text"].includes(df.fieldtype)) {
        input_class = "grid-overflow-no-ellipsis";
      } else if (["Int", "Currency", "Float", "Percent"].includes(df.fieldtype)) {
        input_class = "text-right";
      } else if (df.fieldtype === "Check") {
        title = __("1 = True & 0 = False");
        input_class = "text-center";
      } else if (df.fieldtype === "Password") {
        is_disabled = "disabled";
        title = __("Password cannot be filtered");
      }
      let $col = $(
        '<div class="col grid-static-col col-xs-' + colsize + ' search"></div>'
      ).appendTo(this.row);
      let $search_input = $(`
			<input
				type="text"
				class="form-control input-xs ${input_class}"
				title="${title}"
				data-fieldtype="${df.fieldtype}"
				${is_disabled}
			>
		`).appendTo($col);
      this.search_columns[df.fieldname] = $col;
      $search_input.on(
        "keyup",
        frappe.utils.debounce((e) => {
          this.grid.filter[df.fieldname] = {
            df,
            value: e.target.value
          };
          if (e.target.value == "") {
            delete this.grid.filter[df.fieldname];
          }
          this.grid.grid_sortable.option(
            "disabled",
            Object.keys(this.grid.filter).length !== 0
          );
          this.grid.prevent_build = true;
          this.grid.grid_pagination.go_to_page(1);
          this.grid.refresh();
          this.grid.prevent_build = false;
        }, 500)
      );
      ["Currency", "Float", "Int", "Percent", "Rating"].includes(df.fieldtype) && frappe.utils.only_allow_num_decimal($search_input);
      return $col;
    }
    make_column(df, colsize, txt, ci) {
      let me = this;
      var add_class = ["Text", "Small Text"].indexOf(df.fieldtype) !== -1 ? " grid-overflow-no-ellipsis" : "";
      add_class += ["Int", "Currency", "Float", "Percent"].indexOf(df.fieldtype) !== -1 ? " text-right" : "";
      add_class += ["Check"].indexOf(df.fieldtype) !== -1 ? " text-center" : "";
      let grid;
      let grid_container;
      let inital_position_x = 0;
      let start_x = 0;
      let start_y = 0;
      let input_in_focus = false;
      let vertical = false;
      let horizontal = false;
      function on_input_focus(el) {
        input_in_focus = true;
        let container_width = grid_container.getBoundingClientRect().width;
        let container_left = grid_container.getBoundingClientRect().left;
        let grid_left = parseFloat(grid.style.left);
        let element_left = el.offset().left;
        let fieldtype = el.data("fieldtype");
        let offset_right = container_width - (element_left + el.width());
        let offset_left = 0;
        let element_screen_x = element_left - container_left;
        let element_position_x = container_width - (element_left - container_left);
        if (["Date", "Time", "Datetime"].includes(fieldtype)) {
          offset_left = element_position_x - 220;
        }
        if (["Link", "Dynamic Link"].includes(fieldtype)) {
          offset_left = element_position_x - 250;
        }
        if (element_screen_x < 0) {
          grid.style.left = `${grid_left - element_screen_x}px`;
        } else if (offset_left < 0) {
          grid.style.left = `${grid_left + offset_left}px`;
        } else if (offset_right < 0) {
          grid.style.left = `${grid_left + offset_right}px`;
        }
      }
      function handle_date_picker() {
        let date_time_picker = document.querySelectorAll(".datepicker.active")[0];
        date_time_picker.classList.remove("active");
        date_time_picker.style.width = "220px";
        setTimeout(() => {
          date_time_picker.classList.add("active");
        }, 600);
      }
      function trigger_focus(input_field, col_df) {
        if (["Date", "Datetime"].includes(col_df.fieldtype) && (col_df == null ? void 0 : col_df.read_only)) {
          return;
        }
        input_field.trigger("focus");
      }
      var $col = $(
        '<div class="col grid-static-col col-xs- custom-' + colsize + " " + add_class + '"></div>'
      ).attr("data-fieldname", df.fieldname).attr("data-fieldtype", df.fieldtype).data("df", df).appendTo(this.row).on("touchstart", function(event) {
        grid_container = $(event.currentTarget).closest(".form-grid-container")[0];
        grid = $(event.currentTarget).closest(".form-grid")[0];
        grid.style.position != "relative" && $(grid).css("position", "relative");
        !grid.style.left && $(grid).css("left", 0);
        start_x = event.touches[0].clientX;
        start_y = event.touches[0].clientY;
        inital_position_x = -parseFloat(grid.style.left || 0) + start_x;
      }).on("touchmove", function(event) {
        if (input_in_focus)
          return;
        let moved_x;
        let moved_y;
        if (!horizontal && !vertical) {
          moved_x = Math.abs(start_x - event.touches[0].clientX);
          moved_y = Math.abs(start_y - event.touches[0].clientY);
        }
        if (!vertical && moved_x > 16) {
          horizontal = true;
        } else if (!horizontal && moved_y > 16) {
          vertical = true;
        }
        if (horizontal) {
          event.preventDefault();
          let grid_start = inital_position_x - event.touches[0].clientX;
          let grid_end = grid.clientWidth - grid_container.clientWidth + 2;
          if (frappe.utils.is_rtl()) {
            grid_start = -grid_start;
          }
          if (grid_start < 0) {
            grid_start = 0;
          } else if (grid_start > grid_end) {
            grid_start = grid_end;
          }
          grid.style.left = `${frappe.utils.is_rtl() ? "" : "-"}${grid_start}px`;
        }
      }).on("touchend", function() {
        vertical = false;
        horizontal = false;
      }).on("click", function(event) {
        if (frappe.ui.form.editable_row !== me) {
          var out = me.toggle_editable_row();
        }
        var col = this;
        let first_input_field = $(col).find('input[type="Text"]:first');
        let input_in_focus2 = false;
        $(col).find("input[type='text']").each(function() {
          if ($(this).is(":focus")) {
            input_in_focus2 = true;
          }
        });
        !input_in_focus2 && trigger_focus(first_input_field, $(col).data("df"));
        if (event.pointerType == "touch") {
          first_input_field.length && on_input_focus(first_input_field);
          first_input_field.one("blur", () => input_in_focus2 = false);
          first_input_field.data("fieldtype") == "Date" && handle_date_picker();
        }
        return out;
      });
      $col.field_area = $('<div class="field-area"></div>').appendTo($col).toggle(false);
      $col.static_area = $('<div class="static-area ellipsis"></div>').appendTo($col).html(txt);
      if (!this.doc) {
        $col.attr("title", txt);
      }
      df.fieldname && $col.static_area.toggleClass("reqd", Boolean(df.reqd));
      $col.df = df;
      $col.column_index = ci;
      this.columns[df.fieldname] = $col;
      this.columns_list.push($col);
      return $col;
    }
    activate() {
      this.toggle_editable_row(true);
      return this;
    }
    toggle_editable_row(show) {
      var me = this;
      if (this.grid.allow_on_grid_editing() && this.grid.is_editable() && this.doc && show !== false) {
        if (frappe.ui.form.editable_row && frappe.ui.form.editable_row !== this) {
          frappe.ui.form.editable_row.toggle_editable_row(false);
        }
        this.row.toggleClass("editable-row", true);
        this.columns_list.forEach(function(column) {
          me.make_control(column);
          column.static_area.toggle(false);
          column.field_area.toggle(true);
        });
        frappe.ui.form.editable_row = this;
        return false;
      } else {
        this.row.toggleClass("editable-row", false);
        this.columns_list.forEach((column, index) => {
          if (!this.frm) {
            let df = this.grid.visible_columns[index][0];
            let txt = this.doc ? frappe.format(this.doc[df.fieldname], df, null, this.doc) : __(df.label, null, df.parent);
            this.refresh_field(df.fieldname, txt);
          }
          if (!column.df.hidden) {
            column.static_area.toggle(true);
          }
          column.field_area && column.field_area.toggle(false);
        });
        frappe.ui.form.editable_row = null;
      }
    }
    make_control(column) {
      if (column.field)
        return;
      var me = this, parent = column.field_area, df = column.df;
      if (df.fieldtype == "Text Editor") {
        df = Object.assign({}, df);
        df.fieldtype = "Text";
      }
      var field = frappe.ui.form.make_control({
        df,
        parent,
        only_input: true,
        with_link_btn: true,
        doc: this.doc,
        doctype: this.doc.doctype,
        docname: this.doc.name,
        frm: this.grid.frm,
        grid: this.grid,
        grid_row: this,
        value: this.doc[df.fieldname]
      });
      field.get_query = this.grid.get_field(df.fieldname).get_query;
      if (!field.df.onchange_modified) {
        var field_on_change_function = field.df.onchange;
        field.df.onchange = (e) => {
          field_on_change_function && field_on_change_function(e);
          this.refresh_field(field.df.fieldname);
        };
        field.df.onchange_modified = true;
      }
      field.refresh();
      if (field.$input) {
        field.$input.addClass("input-sm").attr("data-col-idx", column.column_index).attr("placeholder", __(df.placeholder || df.label));
        if (this.columns_list && this.columns_list.slice(-1)[0] === column) {
          field.$input.attr("data-last-input", 1);
        }
      }
      this.set_arrow_keys(field);
      column.field = field;
      this.on_grid_fields_dict[df.fieldname] = field;
      this.on_grid_fields.push(field);
    }
    set_arrow_keys(field) {
      var me = this;
      let ignore_fieldtypes = ["Text", "Small Text", "Code", "Text Editor", "HTML Editor"];
      if (field.$input) {
        field.$input.on("keydown", function(e) {
          var { TAB, UP: UP_ARROW, DOWN: DOWN_ARROW } = frappe.ui.keyCode;
          if (![TAB, UP_ARROW, DOWN_ARROW].includes(e.which)) {
            return;
          }
          var values = me.grid.get_data();
          var fieldname = $(this).attr("data-fieldname");
          var fieldtype = $(this).attr("data-fieldtype");
          let ctrl_key = e.metaKey || e.ctrlKey;
          if (!ignore_fieldtypes.includes(fieldtype) && ctrl_key && e.which !== TAB) {
            me.add_new_row_using_keys(e);
            return;
          }
          if (e.shiftKey && e.altKey && DOWN_ARROW === e.which) {
            me.duplicate_row_using_keys();
            return;
          }
          var move_up_down = function(base) {
            if (ignore_fieldtypes.includes(fieldtype) && !e.altKey) {
              return false;
            }
            if (field.autocomplete_open) {
              return false;
            }
            base.toggle_editable_row();
            var input = base.columns[fieldname].field.$input;
            if (input) {
              input.focus();
            }
            return true;
          };
          if (e.which === TAB && !e.shiftKey) {
            var last_column = me.wrapper.find(":input:enabled:last").get(0);
            var is_last_column = $(this).attr("data-last-input") || last_column === this;
            if (is_last_column) {
              if (me.doc.idx === values.length) {
                setTimeout(function() {
                  me.grid.add_new_row(null, null, true);
                  me.grid.grid_rows[me.grid.grid_rows.length - 1].toggle_editable_row();
                  me.grid.set_focus_on_row();
                }, 100);
              } else {
                me.grid.grid_rows[me.doc.idx].toggle_editable_row();
                me.grid.set_focus_on_row(me.doc.idx);
                return false;
              }
            }
          } else if (e.which === UP_ARROW) {
            if (me.doc.idx > 1) {
              var prev = me.grid.grid_rows[me.doc.idx - 2];
              if (move_up_down(prev)) {
                return false;
              }
            }
          } else if (e.which === DOWN_ARROW) {
            if (me.doc.idx < values.length) {
              var next = me.grid.grid_rows[me.doc.idx];
              if (move_up_down(next)) {
                return false;
              }
            }
          }
        });
      }
    }
    duplicate_row_using_keys() {
      setTimeout(() => {
        this.insert(false, true, true);
        this.grid.grid_rows[this.doc.idx].toggle_editable_row();
        this.grid.set_focus_on_row(this.doc.idx);
      }, 100);
    }
    add_new_row_using_keys(e) {
      let idx = "";
      let ctrl_key = e.metaKey || e.ctrlKey;
      let is_down_arrow_key_press = e.which === 40;
      if (ctrl_key && e.shiftKey) {
        idx = is_down_arrow_key_press ? null : 1;
        this.grid.add_new_row(
          idx,
          null,
          is_down_arrow_key_press,
          false,
          is_down_arrow_key_press,
          !is_down_arrow_key_press
        );
        idx = is_down_arrow_key_press ? cint(this.grid.grid_rows.length) - 1 : 0;
      } else if (ctrl_key) {
        idx = is_down_arrow_key_press ? this.doc.idx : this.doc.idx - 1;
        this.insert(false, is_down_arrow_key_press);
      }
      if (idx !== "") {
        setTimeout(() => {
          this.grid.grid_rows[idx].toggle_editable_row();
          this.grid.set_focus_on_row(idx);
        }, 100);
      }
    }
    get_open_form() {
      return frappe.ui.form.get_open_grid_form();
    }
    toggle_view(show, callback) {
      if (!this.doc) {
        return this;
      }
      if (this.frm) {
        this.doc = locals[this.doc.doctype][this.doc.name];
      }
      var open_row = this.get_open_form();
      if (show === void 0)
        show = !open_row;
      document.activeElement && document.activeElement.blur();
      if (show && open_row) {
        if (open_row == this) {
          callback && callback();
          return;
        } else {
          open_row.toggle_view(false);
        }
      }
      if (show) {
        this.show_form();
      } else {
        this.hide_form();
      }
      callback && callback();
      return this;
    }
    show_form() {
      if (frappe.utils.is_xs()) {
        $(this.grid.form_grid).css("min-width", "0");
        $(this.grid.form_grid).css("position", "unset");
      }
      if (!this.grid_form) {
        this.grid_form = new GridRowForm({
          row: this
        });
      }
      this.grid_form.render();
      this.row.toggle(false);
      let cannot_add_rows = this.grid.cannot_add_rows || this.grid.df && this.grid.df.cannot_add_rows;
      this.wrapper.find(
        ".grid-insert-row-below, .grid-insert-row, .grid-duplicate-row, .grid-append-row"
      ).toggle(!cannot_add_rows);
      this.wrapper.find(".grid-delete-row").toggle(!(this.grid.df && this.grid.df.cannot_delete_rows));
      frappe.dom.freeze("", "dark grid-form");
      if (cur_frm)
        cur_frm.cur_grid = this;
      this.wrapper.addClass("grid-row-open");
      if (!frappe.dom.is_element_in_viewport(this.wrapper) && !frappe.dom.is_element_in_modal(this.wrapper)) {
        frappe.utils.scroll_to(this.wrapper, true, -15);
      }
      if (this.frm) {
        this.frm.script_manager.trigger(this.doc.parentfield + "_on_form_rendered");
        this.frm.script_manager.trigger("form_render", this.doc.doctype, this.doc.name);
      }
    }
    hide_form() {
      if (frappe.utils.is_xs()) {
        $(this.grid.form_grid).css("min-width", "738px");
        $(this.grid.form_grid).css("position", "relative");
      }
      frappe.dom.unfreeze();
      this.row.toggle(true);
      if (!frappe.dom.is_element_in_modal(this.row)) {
        frappe.utils.scroll_to(this.row, true, 15);
      }
      this.refresh();
      if (cur_frm)
        cur_frm.cur_grid = null;
      this.wrapper.removeClass("grid-row-open");
    }
    open_prev() {
      if (!this.doc)
        return;
      this.open_row_at_index(this.doc.idx - 2);
    }
    open_next() {
      if (!this.doc)
        return;
      if (!this.open_row_at_index(this.doc.idx)) {
        this.grid.add_new_row(null, null, true);
      }
    }
    open_row_at_index(row_index) {
      if (!this.grid.data[row_index])
        return;
      this.change_page_if_reqd(row_index);
      this.grid.grid_rows[row_index].toggle_view(true);
      return true;
    }
    change_page_if_reqd(row_index) {
      const { page_index, page_length } = this.grid.grid_pagination;
      row_index++;
      let new_page;
      if (row_index <= (page_index - 1) * page_length) {
        new_page = page_index - 1;
      } else if (row_index > page_index * page_length) {
        new_page = page_index + 1;
      }
      if (new_page) {
        this.grid.grid_pagination.go_to_page(new_page);
      }
    }
    refresh_field(fieldname, txt) {
      let fields = this.grid.user_defined_columns && this.grid.user_defined_columns.length > 0 ? this.grid.user_defined_columns : this.docfields;
      let df = fields.find((col) => {
        return (col == null ? void 0 : col.fieldname) === fieldname;
      });
      if (df && this.doc) {
        txt = frappe.format(this.doc[fieldname], df, null, this.doc);
      }
      if (!txt && this.frm) {
        txt = frappe.format(this.doc[fieldname], df, null, this.frm.doc);
      }
      let column = this.columns[fieldname];
      if (column) {
        column.static_area.html(txt || "");
        if (df && df.reqd) {
          column.toggleClass("error", !!(txt === null || txt === ""));
        }
      }
      let field = this.on_grid_fields_dict[fieldname];
      if (field) {
        field.docname = this.doc.name;
        field.refresh();
      }
      if (this.grid_form) {
        this.grid_form.refresh_field(fieldname);
      }
    }
    get_field(fieldname) {
      let field = this.on_grid_fields_dict[fieldname];
      if (field) {
        return field;
      } else if (this.grid_form) {
        return this.grid_form.fields_dict[fieldname];
      } else {
        throw `fieldname ${fieldname} not found`;
      }
    }
    get_visible_columns(blacklist = []) {
      var me = this;
      var visible_columns = $.map(this.docfields, function(df) {
        var visible = !df.hidden && df.in_list_view && me.grid.frm.get_perm(df.permlevel, "read") && !frappe.model.layout_fields.includes(df.fieldtype) && !blacklist.includes(df.fieldname);
        return visible ? df : null;
      });
      return visible_columns;
    }
    set_field_property(fieldname, property, value) {
      var me = this;
      var set_property = function(field) {
        if (!field)
          return;
        field.df[property] = value;
        field.refresh();
      };
      if (this.grid_form) {
        set_property(this.grid_form.fields_dict[fieldname]);
        this.grid_form.layout && this.grid_form.layout.refresh_sections();
      }
      set_property(this.on_grid_fields_dict[fieldname]);
    }
    toggle_reqd(fieldname, reqd) {
      this.set_field_property(fieldname, "reqd", reqd ? 1 : 0);
    }
    toggle_display(fieldname, show) {
      this.set_field_property(fieldname, "hidden", show ? 0 : 1);
    }
    toggle_editable(fieldname, editable) {
      this.set_field_property(fieldname, "read_only", editable ? 0 : 1);
    }
  };

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/grid_pagination.js
  var GridPagination = class {
    constructor(opts) {
      $.extend(this, opts);
      this.setup_pagination();
    }
    setup_pagination() {
      this.page_length = 50;
      this.page_index = 1;
      this.total_pages = Math.ceil(this.grid.data.length / this.page_length);
      this.render_pagination();
    }
    render_pagination() {
      if (this.grid.data.length <= this.page_length) {
        this.wrapper.find(".grid-pagination").html("");
      } else {
        let $pagination_template = this.get_pagination_html();
        this.wrapper.find(".grid-pagination").html($pagination_template);
        this.prev_page_button = this.wrapper.find(".prev-page");
        this.next_page_button = this.wrapper.find(".next-page");
        this.$page_number = this.wrapper.find(".current-page-number");
        this.$total_pages = this.wrapper.find(".total-page-number");
        this.first_page_button = this.wrapper.find(".first-page");
        this.last_page_button = this.wrapper.find(".last-page");
        this.bind_pagination_events();
      }
    }
    bind_pagination_events() {
      this.prev_page_button.on("click", () => {
        this.render_prev_page();
      });
      this.next_page_button.on("click", () => {
        this.render_next_page();
      });
      this.first_page_button.on("click", () => {
        this.go_to_page(1);
      });
      this.last_page_button.on("click", () => {
        this.go_to_page(this.total_pages);
      });
      this.$page_number.on("keyup", (e) => {
        e.currentTarget.style.width = (e.currentTarget.value.length + 1) * 8 + "px";
      });
      this.$page_number.on("keydown", (e) => {
        e = e ? e : window.event;
        var charCode = e.which ? e.which : e.keyCode;
        let arrow = { up: 38, down: 40 };
        switch (charCode) {
          case arrow.up:
            this.inc_dec_number(true);
            break;
          case arrow.down:
            this.inc_dec_number(false);
            break;
        }
        if (charCode > 31 && (charCode < 48 || charCode > 57) && ![37, 38, 39, 40].includes(charCode)) {
          return false;
        }
        return true;
      });
      this.$page_number.on("focusout", (e) => {
        if (this.page_index == e.currentTarget.value)
          return;
        this.page_index = e.currentTarget.value;
        if (this.page_index < 1) {
          this.page_index = 1;
        } else if (this.page_index > this.total_pages) {
          this.page_index = this.total_pages;
        }
        this.go_to_page();
      });
    }
    inc_dec_number(increment) {
      let new_value = parseInt(this.$page_number.val());
      increment ? new_value++ : new_value--;
      if (new_value < 1 || new_value > this.total_pages)
        return;
      this.$page_number.val(new_value);
    }
    update_page_numbers() {
      let total_pages = Math.ceil(this.grid.data.length / this.page_length);
      if (this.total_pages !== total_pages) {
        this.total_pages = total_pages;
        this.render_pagination();
      }
    }
    check_page_number() {
      if (this.page_index > this.total_pages && this.page_index > 1) {
        this.go_to_page(this.page_index - 1);
      }
    }
    get_pagination_html() {
      let page_text_html = `<div class="page-text">
				<input class="current-page-number page-number" type="text" value="${__(this.page_index)}"/>
				<span>${__("of")}</span>
				<span class="total-page-number page-number"> ${__(this.total_pages)} </span>
			</div>`;
      return $(`<button class="btn btn-secondary btn-xs first-page"">
				<span>${__("First")}</span>
			</button>
			<button class="btn btn-secondary btn-xs prev-page">${frappe.utils.icon("left", "xs")}</button>
			${page_text_html}
			<button class="btn btn-secondary btn-xs next-page">${frappe.utils.icon("right", "xs")}</button>
			<button class="btn btn-secondary btn-xs last-page">
				<span>${__("Last")}</span>
			</button>`);
    }
    render_next_page() {
      if (this.page_index * this.page_length < this.grid.data.length) {
        this.page_index++;
        this.go_to_page();
      }
    }
    render_prev_page() {
      if (this.page_index > 1) {
        this.page_index--;
        this.go_to_page();
      }
    }
    go_to_page(index, from_refresh) {
      if (!index) {
        index = this.page_index;
      } else {
        this.page_index = index;
      }
      let $rows = $(this.grid.parent).find(".rows").empty();
      this.grid.render_result_rows($rows, true);
      if (this.$page_number) {
        this.$page_number.val(index);
        this.$page_number.css("width", (index.toString().length + 1) * 8 + "px");
      }
      this.update_page_numbers();
      if (!from_refresh) {
        this.grid.scroll_to_top();
      }
    }
    go_to_last_page_to_add_row() {
      let total_pages = this.total_pages;
      let page_length = this.page_length;
      if (this.grid.data.length == page_length * total_pages) {
        this.go_to_page(total_pages + 1);
        frappe.utils.scroll_to(this.wrapper);
      } else if (this.page_index == this.total_pages) {
        return;
      } else {
        this.go_to_page(total_pages);
      }
    }
    get_result_length() {
      return this.grid.data.length < this.page_index * this.page_length ? this.grid.data.length : this.page_index * this.page_length;
    }
  };

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/grid.js
  frappe.ui.form.get_open_grid_form = function() {
    return $(".grid-row-open").data("grid_row");
  };
  frappe.ui.form.close_grid_form = function() {
    var open_form = frappe.ui.form.get_open_grid_form();
    open_form && open_form.hide_form();
    if (frappe.ui.form.editable_row) {
      frappe.ui.form.editable_row.toggle_editable_row(false);
    }
  };
  var Grid = class {
    constructor(opts) {
      $.extend(this, opts);
      this.fieldinfo = {};
      this.doctype = this.df.options;
      if (this.doctype) {
        this.meta = frappe.get_meta(this.doctype);
      }
      this.fields_map = {};
      this.template = null;
      this.multiple_set = false;
      if (this.frm && this.frm.meta.__form_grid_templates && this.frm.meta.__form_grid_templates[this.df.fieldname]) {
        this.template = this.frm.meta.__form_grid_templates[this.df.fieldname];
      }
      this.filter = {};
      this.is_grid = true;
      this.debounced_refresh = this.refresh.bind(this);
      this.debounced_refresh = frappe.utils.debounce(this.debounced_refresh, 100);
    }
    get perm() {
      var _a, _b;
      return ((_a = this.control) == null ? void 0 : _a.perm) || ((_b = this.frm) == null ? void 0 : _b.perm) || this.df.perm;
    }
    set perm(_perm) {
      console.error("Setting perm on grid isn't supported, update form's perm instead");
    }
    allow_on_grid_editing() {
      if (this.meta && this.meta.editable_grid || !this.meta) {
        return true;
      } else {
        return false;
      }
    }
    make() {
      let template = `
			<div class="grid-field">
				<label class="control-label">${__(this.df.label || "")}</label>
				<span class="help"></span>
				<p class="text-muted small grid-description"></p>
				<div class="grid-custom-buttons"></div>
				<div class="form-grid-container">
					<div class="form-grid">
						<div class="grid-heading-row"></div>
						<div class="grid-body">
							<div class="rows"></div>
							<div class="grid-empty text-center">
								<img
									src="/assets/frappe/images/ui-states/grid-empty-state.svg"
									alt="Grid Empty State"
									class="grid-empty-illustration"
								>
								${__("No Data")}
							</div>
						</div>
					</div>
				</div>
				<div class="small form-clickable-section grid-footer">
					<div class="flex justify-between">
						<div class="grid-buttons">
							<button type="button" class="btn btn-xs btn-danger grid-remove-rows hidden"
								data-action="delete_rows">
								${__("Delete")}
							</button>
							<button type="button" class="btn btn-xs btn-danger grid-remove-all-rows hidden"
								data-action="delete_all_rows">
								${__("Delete All")}
							</button>
							<!-- hack to allow firefox include this in tabs -->
							<button type="button" class="btn btn-xs btn-secondary grid-add-row">
								${__("Add Row")}
							</button>
							<button type="button" class="grid-add-multiple-rows btn btn-xs btn-secondary hidden">
								${__("Add Multiple")}</a>
							</button>
						</div>
						<div class="grid-pagination">
						</div>
						<div class="grid-bulk-actions text-right">
							<button type="button" class="grid-download btn btn-xs btn-secondary hidden">
								${__("Download")}
							</button>
							<button type="button" class="grid-upload btn btn-xs btn-secondary hidden">
								${__("Upload")}
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
      this.wrapper = $(template).appendTo(this.parent);
      $(this.parent).addClass("form-group");
      this.set_grid_description();
      this.set_doc_url();
      frappe.utils.bind_actions_with_object(this.wrapper, this);
      this.form_grid = this.wrapper.find(".form-grid");
      this.setup_add_row();
      this.setup_grid_pagination();
      this.custom_buttons = {};
      this.grid_buttons = this.wrapper.find(".grid-buttons");
      this.grid_custom_buttons = this.wrapper.find(".grid-custom-buttons");
      this.remove_rows_button = this.grid_buttons.find(".grid-remove-rows");
      this.remove_all_rows_button = this.grid_buttons.find(".grid-remove-all-rows");
      this.setup_allow_bulk_edit();
      this.setup_check();
      if (this.df.on_setup) {
        this.df.on_setup(this);
      }
    }
    set_grid_description() {
      let description_wrapper = $(this.parent).find(".grid-description");
      if (this.df.description) {
        description_wrapper.text(__(this.df.description));
      } else {
        description_wrapper.hide();
      }
    }
    set_doc_url() {
      var _a;
      let unsupported_fieldtypes = frappe.model.no_value_type.filter(
        (x) => frappe.model.table_fields.indexOf(x) === -1
      );
      if (!this.df.label || !((_a = this.df) == null ? void 0 : _a.documentation_url) || unsupported_fieldtypes.includes(this.df.fieldtype))
        return;
      let $help = $(this.parent).find("span.help");
      $help.empty();
      $(`<a href="${this.df.documentation_url}" target="_blank">
			${frappe.utils.icon("help", "sm")}
		</a>`).appendTo($help);
    }
    setup_grid_pagination() {
      this.grid_pagination = new GridPagination({
        grid: this,
        wrapper: this.wrapper
      });
    }
    setup_check() {
      this.wrapper.on("click", ".grid-row-check", (e) => {
        var _a;
        const $check = $(e.currentTarget);
        const checked = $check.prop("checked");
        const is_select_all = $check.parents(".grid-heading-row:first").length !== 0;
        const docname = (_a = $check.parents(".grid-row:first")) == null ? void 0 : _a.attr("data-name");
        if (is_select_all) {
          this.form_grid.find(".grid-row-check").prop("checked", checked);
          let result_length = this.grid_pagination.get_result_length();
          let page_index = this.grid_pagination.page_index;
          let page_length = this.grid_pagination.page_length;
          for (let ri = (page_index - 1) * page_length; ri < result_length; ri++) {
            this.grid_rows[ri].select(checked);
          }
        } else if (docname) {
          if (e.shiftKey && this.last_checked_docname) {
            this.check_range(docname, this.last_checked_docname, checked);
          }
          this.grid_rows_by_docname[docname].select(checked);
          this.last_checked_docname = docname;
        }
        this.refresh_remove_rows_button();
      });
    }
    check_range(docname1, docname2, checked = true) {
      var _a;
      const row_1 = this.grid_rows_by_docname[docname1];
      const row_2 = this.grid_rows_by_docname[docname2];
      const index_1 = this.grid_rows.indexOf(row_1);
      const index_2 = this.grid_rows.indexOf(row_2);
      if (index_1 === -1 || index_2 === -1)
        return;
      const [start, end] = [index_1, index_2].sort((a, b) => a - b);
      const rows = this.grid_rows.slice(start, end + 1);
      for (const row of rows) {
        row.select(checked);
        (_a = row.row_check) == null ? void 0 : _a.find(".grid-row-check").prop("checked", checked);
      }
    }
    delete_rows() {
      var dirty = false;
      let tasks = [];
      let selected_children = this.get_selected_children();
      selected_children.forEach((doc) => {
        tasks.push(() => {
          if (!this.frm) {
            this.df.data = this.get_data();
            this.df.data = this.df.data.filter((row) => row.idx != doc.idx);
          }
          this.grid_rows_by_docname[doc.name].remove();
          dirty = true;
        });
        tasks.push(() => frappe.timeout(0.1));
      });
      if (!this.frm) {
        tasks.push(() => {
          this.df.data.forEach((row, index) => row.idx = index + 1);
        });
      }
      tasks.push(() => {
        if (dirty) {
          this.refresh();
          this.frm && this.frm.script_manager.trigger(this.df.fieldname + "_delete", this.doctype);
        }
      });
      frappe.run_serially(tasks);
      this.wrapper.find(".grid-heading-row .grid-row-check:checked:first").prop("checked", 0);
      if (selected_children.length == this.grid_pagination.page_length) {
        this.scroll_to_top();
      }
    }
    delete_all_rows() {
      frappe.confirm(__("Are you sure you want to delete all rows?"), () => {
        this.frm.doc[this.df.fieldname] = [];
        $(this.parent).find(".rows").empty();
        this.grid_rows = [];
        this.refresh();
        this.frm && this.frm.script_manager.trigger(this.df.fieldname + "_delete", this.doctype);
        this.frm && this.frm.dirty();
        this.scroll_to_top();
      });
    }
    scroll_to_top() {
      frappe.utils.scroll_to(this.wrapper);
    }
    select_row(name) {
      this.grid_rows_by_docname[name].select();
    }
    remove_all() {
      this.grid_rows.forEach((row) => {
        row.remove();
      });
    }
    refresh_remove_rows_button() {
      if (this.df.cannot_delete_rows) {
        return;
      }
      this.remove_rows_button.toggleClass(
        "hidden",
        this.wrapper.find(".grid-body .grid-row-check:checked:first").length ? false : true
      );
      let select_all_checkbox_checked = this.wrapper.find(
        ".grid-heading-row .grid-row-check:checked:first"
      ).length;
      let show_delete_all_btn = select_all_checkbox_checked && this.data.length > this.get_selected_children().length;
      this.remove_all_rows_button.toggleClass("hidden", !show_delete_all_btn);
    }
    get_selected() {
      return (this.grid_rows || []).map((row) => {
        return row.doc.__checked ? row.doc.name : null;
      }).filter((d) => {
        return d;
      });
    }
    get_selected_children() {
      return (this.grid_rows || []).map((row) => {
        return row.doc.__checked ? row.doc : null;
      }).filter((d) => {
        return d;
      });
    }
    reset_grid() {
      this.visible_columns = [];
      this.grid_rows = [];
      $(this.parent).find(".grid-body .grid-row").remove();
      this.refresh();
    }
    make_head() {
      if (this.prevent_build)
        return;
      if (this.header_row) {
        $(this.parent).find(".grid-heading-row .grid-row").remove();
      }
      this.header_row = new GridRow({
        parent: $(this.parent).find(".grid-heading-row"),
        parent_df: this.df,
        docfields: this.docfields,
        frm: this.frm,
        grid: this,
        configure_columns: true
      });
      this.header_search = new GridRow({
        parent: $(this.parent).find(".grid-heading-row"),
        parent_df: this.df,
        docfields: this.docfields,
        frm: this.frm,
        grid: this,
        show_search: true
      });
      this.header_search.row.addClass("filter-row");
      if (this.header_search.show_search || this.header_search.show_search_row()) {
        $(this.parent).find(".grid-heading-row").addClass("with-filter");
      } else {
        $(this.parent).find(".grid-heading-row").removeClass("with-filter");
      }
      this.filter_applied && this.update_search_columns();
    }
    update_search_columns() {
      for (const field in this.filter) {
        if (this.filter[field] && !this.header_search.search_columns[field]) {
          delete this.filter[field];
          this.data = this.get_data(this.filter_applied);
          break;
        }
        if (this.filter[field] && this.filter[field].value) {
          let $input = this.header_search.row_index.find("input");
          if (field && field !== "row-index") {
            $input = this.header_search.search_columns[field].find("input");
          }
          $input.val(this.filter[field].value);
        }
      }
    }
    refresh() {
      if (this.frm && this.frm.setting_dependency)
        return;
      this.filter_applied = Object.keys(this.filter).length !== 0;
      this.data = this.get_data(this.filter_applied);
      !this.wrapper && this.make();
      let $rows = $(this.parent).find(".rows");
      this.setup_fields();
      if (this.frm) {
        this.display_status = frappe.perm.get_field_display_status(
          this.df,
          this.frm.doc,
          this.perm
        );
      } else if (this.df.is_web_form && this.control) {
        this.display_status = this.control.get_status();
      } else {
        this.display_status = "Write";
      }
      if (this.display_status === "None")
        return;
      this.make_head();
      if (!this.grid_rows) {
        this.grid_rows = [];
      }
      this.truncate_rows();
      this.grid_rows_by_docname = {};
      this.grid_pagination.update_page_numbers();
      this.render_result_rows($rows, false);
      this.grid_pagination.check_page_number();
      this.wrapper.find(".grid-empty").toggleClass("hidden", Boolean(this.data.length));
      this.setup_toolbar();
      this.toggle_checkboxes(this.display_status !== "Read");
      if (this.is_sortable() && !this.sortable_setup_done) {
        this.make_sortable($rows);
        this.sortable_setup_done = true;
      }
      this.last_display_status = this.display_status;
      this.last_docname = this.frm && this.frm.docname;
      this.form_grid.toggleClass("error", !!(this.df.reqd && !(this.data && this.data.length)));
      this.refresh_remove_rows_button();
      this.wrapper.trigger("change");
    }
    render_result_rows($rows, append_row) {
      let result_length = this.grid_pagination.get_result_length();
      let page_index = this.grid_pagination.page_index;
      let page_length = this.grid_pagination.page_length;
      if (!this.grid_rows) {
        return;
      }
      for (var ri = (page_index - 1) * page_length; ri < result_length; ri++) {
        var d = this.data[ri];
        if (!d) {
          return;
        }
        if (d.idx === void 0) {
          d.idx = ri + 1;
        }
        if (d.name === void 0) {
          d.name = "row " + d.idx;
        }
        let grid_row;
        if (this.grid_rows[ri] && !append_row) {
          grid_row = this.grid_rows[ri];
          grid_row.doc = d;
          grid_row.refresh();
        } else {
          grid_row = new GridRow({
            parent: $rows,
            parent_df: this.df,
            docfields: this.docfields,
            doc: d,
            frm: this.frm,
            grid: this
          });
          this.grid_rows[ri] = grid_row;
        }
        this.grid_rows_by_docname[d.name] = grid_row;
      }
    }
    setup_toolbar() {
      if (this.is_editable()) {
        this.wrapper.find(".grid-footer").toggle(true);
        if (this.cannot_add_rows || this.df && this.df.cannot_add_rows) {
          this.wrapper.find(".grid-add-row, .grid-add-multiple-rows").addClass("hidden");
        } else {
          this.wrapper.find(".grid-add-row").removeClass("hidden");
          if (this.multiple_set) {
            this.wrapper.find(".grid-add-multiple-rows").removeClass("hidden");
          }
        }
      } else if (this.grid_rows.length < this.grid_pagination.page_length && !this.df.allow_bulk_edit) {
        this.wrapper.find(".grid-footer").toggle(false);
      }
      this.wrapper.find(".grid-add-row, .grid-add-multiple-rows, .grid-upload").toggle(this.is_editable());
    }
    truncate_rows() {
      if (this.grid_rows.length > this.data.length) {
        for (var i = this.data.length; i < this.grid_rows.length; i++) {
          var grid_row = this.grid_rows[i];
          if (grid_row)
            grid_row.wrapper.remove();
        }
        this.grid_rows.splice(this.data.length);
      }
    }
    setup_fields() {
      if (this.frm && this.frm.docname) {
        this.df = frappe.meta.get_docfield(
          this.frm.doctype,
          this.df.fieldname,
          this.frm.docname
        );
      } else {
        if (this.df.options) {
          this.df = frappe.meta.get_docfield(this.df.options, this.df.fieldname) || this.df || null;
        }
      }
      if (this.doctype && this.frm) {
        this.docfields = frappe.meta.get_docfields(this.doctype, this.frm.docname);
      } else {
        this.docfields = this.df.fields;
      }
      this.docfields.forEach((df) => {
        this.fields_map[df.fieldname] = df;
      });
    }
    refresh_row(docname) {
      this.grid_rows_by_docname[docname] && this.grid_rows_by_docname[docname].refresh();
    }
    make_sortable($rows) {
      this.grid_sortable = new Sortable($rows.get(0), {
        group: { name: this.df.fieldname },
        handle: ".sortable-handle",
        draggable: ".grid-row",
        animation: 100,
        filter: "li, a",
        onMove: (event) => {
          if (!this.is_editable()) {
            return false;
          }
          let idx = $(event.dragged).closest(".grid-row").attr("data-idx");
          let doc = this.data[idx % this.grid_pagination.page_length];
          if (doc && doc._sortable === false) {
            return false;
          }
        },
        onUpdate: (event) => {
          let idx = $(event.item).closest(".grid-row").attr("data-idx") - 1;
          let doc = this.data[idx % this.grid_pagination.page_length];
          this.renumber_based_on_dom();
          this.frm && this.frm.script_manager.trigger(
            this.df.fieldname + "_move",
            this.df.options,
            doc.name
          );
          this.refresh();
          this.frm && this.frm.dirty();
        }
      });
      this.frm && $(this.frm.wrapper).trigger("grid-make-sortable", [this.frm]);
    }
    get_data(filter_field) {
      let data = [];
      if (filter_field) {
        data = this.get_filtered_data();
      } else {
        data = this.frm ? this.frm.doc[this.df.fieldname] || [] : this.df.data || this.get_modal_data();
      }
      return data;
    }
    get_filtered_data() {
      let all_data = this.frm ? this.frm.doc[this.df.fieldname] : this.df.data;
      if (!all_data)
        return;
      for (const field in this.filter) {
        all_data = all_data.filter((data) => {
          let { df, value } = this.filter[field];
          return this.get_data_based_on_fieldtype(df, data, value.toLowerCase());
        });
      }
      return all_data;
    }
    get_data_based_on_fieldtype(df, data, value) {
      let fieldname = df.fieldname;
      let fieldtype = df.fieldtype;
      let fieldvalue = data[fieldname];
      if (fieldtype === "Check") {
        value = frappe.utils.string_to_boolean(value);
        return Boolean(fieldvalue) === value && data;
      } else if (fieldtype === "Sr No" && data.idx.toString().includes(value)) {
        return data;
      } else if (fieldtype === "Duration" && fieldvalue) {
        let formatted_duration = frappe.utils.get_formatted_duration(fieldvalue);
        if (formatted_duration.includes(value)) {
          return data;
        }
      } else if (fieldtype === "Barcode" && fieldvalue) {
        let barcode = fieldvalue.startsWith("<svg") ? $(fieldvalue).attr("data-barcode-value") : fieldvalue;
        if (barcode.toLowerCase().includes(value)) {
          return data;
        }
      } else if (["Datetime", "Date"].includes(fieldtype) && fieldvalue) {
        let user_formatted_date = frappe.datetime.str_to_user(fieldvalue);
        if (user_formatted_date.includes(value)) {
          return data;
        }
      } else if (["Currency", "Float", "Int", "Percent", "Rating"].includes(fieldtype)) {
        let num = fieldvalue || 0;
        if (fieldtype === "Rating") {
          let out_of_rating = parseInt(df.options) || 5;
          num = num * out_of_rating;
        }
        if (num.toString().indexOf(value) > -1) {
          return data;
        }
      } else if (fieldvalue && fieldvalue.toLowerCase().includes(value)) {
        return data;
      }
    }
    get_modal_data() {
      return this.df.get_data ? this.df.get_data().filter((data) => {
        if (!this.deleted_docs || !this.deleted_docs.includes(data.name)) {
          return data;
        }
      }) : [];
    }
    set_column_disp(fieldname, show) {
      if (Array.isArray(fieldname)) {
        for (let field of fieldname) {
          this.update_docfield_property(field, "hidden", show ? 0 : 1);
          this.set_editable_grid_column_disp(field, show);
        }
      } else {
        this.get_docfield(fieldname).hidden = show ? 0 : 1;
        this.set_editable_grid_column_disp(fieldname, show);
      }
      this.debounced_refresh();
    }
    set_editable_grid_column_disp(fieldname, show) {
      if (this.meta.editable_grid && this.grid_rows) {
        this.grid_rows.forEach((row) => {
          row.columns_list.forEach((column) => {
            if (column.df.fieldname == fieldname) {
              if (show) {
                column.df.hidden = false;
                if (row != frappe.ui.form.editable_row) {
                  column.static_area.show();
                  column.field_area && column.field_area.toggle(false);
                } else {
                  column.static_area.hide();
                  column.field_area && column.field_area.toggle(true);
                  if (column.field) {
                    column.field.refresh();
                    if (column.field.$input)
                      column.field.$input.toggleClass("input-sm", true);
                  }
                }
              } else {
                column.df.hidden = true;
                column.static_area.hide();
              }
            }
          });
        });
      }
      this.refresh();
    }
    toggle_reqd(fieldname, reqd) {
      this.update_docfield_property(fieldname, "reqd", reqd);
      this.debounced_refresh();
    }
    toggle_enable(fieldname, enable) {
      this.update_docfield_property(fieldname, "read_only", enable ? 0 : 1);
      this.debounced_refresh();
    }
    toggle_display(fieldname, show) {
      this.update_docfield_property(fieldname, "hidden", show ? 0 : 1);
      this.debounced_refresh();
    }
    toggle_checkboxes(enable) {
      this.wrapper.find(".grid-row-check").prop("disabled", !enable);
    }
    get_docfield(fieldname) {
      return frappe.meta.get_docfield(
        this.doctype,
        fieldname,
        this.frm ? this.frm.docname : null
      );
    }
    get_row(key) {
      if (typeof key == "number") {
        if (key < 0) {
          return this.grid_rows[this.grid_rows.length + key];
        } else {
          return this.grid_rows[key];
        }
      } else {
        return this.grid_rows_by_docname[key];
      }
    }
    get_grid_row(key) {
      return this.get_row(key);
    }
    get_field(fieldname) {
      if (!this.fieldinfo[fieldname])
        this.fieldinfo[fieldname] = {};
      return this.fieldinfo[fieldname];
    }
    set_value(fieldname, value, doc) {
      if (this.display_status !== "None" && this.grid_rows_by_docname[doc.name]) {
        this.grid_rows_by_docname[doc.name].refresh_field(fieldname, value);
      }
    }
    setup_add_row() {
      this.wrapper.find(".grid-add-row").click(() => {
        this.add_new_row(null, null, true, null, true);
        this.set_focus_on_row();
        return false;
      });
    }
    add_new_row(idx, callback, show, copy_doc, go_to_last_page = false, go_to_first_page = false) {
      if (this.is_editable()) {
        if (go_to_last_page) {
          this.grid_pagination.go_to_last_page_to_add_row();
        } else if (go_to_first_page) {
          this.grid_pagination.go_to_page(1);
        }
        if (this.frm) {
          var d = frappe.model.add_child(
            this.frm.doc,
            this.df.options,
            this.df.fieldname,
            idx
          );
          if (copy_doc) {
            d = this.duplicate_row(d, copy_doc);
          }
          d.__unedited = true;
          this.frm.script_manager.trigger(this.df.fieldname + "_add", d.doctype, d.name);
          this.refresh();
        } else {
          if (!this.df.data) {
            this.df.data = this.get_data() || [];
          }
          const defaults = this.docfields.reduce((acc, d2) => {
            acc[d2.fieldname] = d2.default;
            return acc;
          }, {});
          this.df.data.push(__spreadValues({ idx: this.df.data.length + 1, __islocal: true }, defaults));
          this.refresh();
        }
        if (show) {
          if (idx) {
            this.wrapper.find("[data-idx='" + idx + "']").data("grid_row").toggle_view(true, callback);
          } else {
            if (!this.allow_on_grid_editing()) {
              this.wrapper.find(".grid-row:last").data("grid_row").toggle_view(true, callback);
            }
          }
        }
        return d;
      }
    }
    renumber_based_on_dom() {
      let $rows = $(this.parent).find(".rows");
      $rows.find(".grid-row").each((i, item) => {
        let $item = $(item);
        let index = (this.grid_pagination.page_index - 1) * this.grid_pagination.page_length + i;
        let d = this.grid_rows_by_docname[$item.attr("data-name")].doc;
        d.idx = index + 1;
        $item.attr("data-idx", d.idx);
        if (this.frm)
          this.frm.doc[this.df.fieldname][index] = d;
        this.data[index] = d;
        this.grid_rows[index] = this.grid_rows_by_docname[d.name];
      });
    }
    duplicate_row(d, copy_doc) {
      $.each(copy_doc, function(key, value) {
        if (![
          "creation",
          "modified",
          "modified_by",
          "idx",
          "owner",
          "parent",
          "doctype",
          "name",
          "parentfield"
        ].includes(key)) {
          d[key] = value;
        }
      });
      return d;
    }
    set_focus_on_row(idx) {
      if (!idx && idx !== 0) {
        idx = this.grid_rows.length - 1;
      }
      setTimeout(() => {
        this.grid_rows[idx].row.find('input[type="Text"],textarea,select').filter(":visible:first").focus();
      }, 100);
    }
    setup_visible_columns() {
      if (this.visible_columns && this.visible_columns.length > 0)
        return;
      this.user_defined_columns = [];
      this.setup_user_defined_columns();
      var total_colsize = 1, fields = this.user_defined_columns && this.user_defined_columns.length > 0 ? this.user_defined_columns : this.editable_fields || this.docfields;
      this.visible_columns = [];
      for (var ci in fields) {
        var _df = fields[ci];
        df = this.user_defined_columns && this.user_defined_columns.length > 0 ? _df : this.fields_map[_df.fieldname];
        if (df && !df.hidden && (this.editable_fields || df.in_list_view) && (this.frm && this.frm.get_perm(df.permlevel, "read") || !this.frm) && !frappe.model.layout_fields.includes(df.fieldtype)) {
          if (df.columns) {
            df.colsize = df.columns;
          } else {
            this.update_default_colsize(df);
          }
          if (df.fieldtype == "Link" && !df.formatter && df.parent && frappe.meta.docfield_map[df.parent]) {
            const docfield = frappe.meta.docfield_map[df.parent][df.fieldname];
            if (docfield && docfield.formatter) {
              df.formatter = docfield.formatter;
            }
          }
          total_colsize += df.colsize;
          if (total_colsize > 11)
            return false;
          this.visible_columns.push([df, df.colsize]);
        }
      }
      var passes = 0;
      while (total_colsize < 11 && passes < 12) {
        for (var i in this.visible_columns) {
          var df = this.visible_columns[i][0];
          var colsize = this.visible_columns[i][1];
          if (colsize > 1 && colsize < 11 && frappe.model.is_non_std_field(df.fieldname)) {
            if (passes < 3 && ["Int", "Currency", "Float", "Check", "Percent"].indexOf(df.fieldtype) !== -1) {
              continue;
            }
            this.visible_columns[i][1] += 1;
            total_colsize++;
          }
          if (total_colsize > 10)
            break;
        }
        passes++;
      }
    }
    update_default_colsize(df) {
      var colsize = 2;
      switch (df.fieldtype) {
        case "Text":
          break;
        case "Small Text":
          colsize = 3;
          break;
        case "Check":
          colsize = 1;
      }
      df.colsize = colsize;
    }
    setup_user_defined_columns() {
      if (!this.frm)
        return;
      let user_settings = frappe.get_user_settings(this.frm.doctype, "GridView");
      if (user_settings && user_settings[this.doctype] && user_settings[this.doctype].length) {
        this.user_defined_columns = user_settings[this.doctype].map((row) => {
          let column = frappe.meta.get_docfield(this.doctype, row.fieldname);
          if (column) {
            column.in_list_view = 1;
            column.columns = row.columns;
            return column;
          }
        }).filter(Boolean);
      }
    }
    is_editable() {
      return this.display_status == "Write" && !this.static_rows;
    }
    is_sortable() {
      return this.sortable_status || this.is_editable();
    }
    only_sortable(status) {
      if (status === void 0 ? true : status) {
        this.sortable_status = true;
        this.static_rows = true;
      }
    }
    set_multiple_add(link, qty) {
      if (this.multiple_set)
        return;
      var link_field = frappe.meta.get_docfield(this.df.options, link);
      var btn = $(this.wrapper).find(".grid-add-multiple-rows");
      btn.removeClass("hidden");
      btn.on("click", () => {
        new frappe.ui.form.LinkSelector({
          doctype: link_field.options,
          fieldname: link,
          qty_fieldname: qty,
          get_query: link_field.get_query,
          target: this,
          txt: ""
        });
        this.grid_pagination.go_to_last_page_to_add_row();
        return false;
      });
      this.multiple_set = true;
    }
    setup_allow_bulk_edit() {
      let me = this;
      if (this.frm && this.frm.get_docfield(this.df.fieldname).allow_bulk_edit) {
        this.setup_download();
        const value_formatter_map = {
          Date: (val) => val ? frappe.datetime.user_to_str(val) : val,
          Int: (val) => cint(val),
          Check: (val) => cint(val),
          Float: (val) => flt(val),
          Currency: (val) => flt(val)
        };
        frappe.flags.no_socketio = true;
        $(this.wrapper).find(".grid-upload").removeClass("hidden").on("click", () => {
          new frappe.ui.FileUploader({
            as_dataurl: true,
            allow_multiple: false,
            restrictions: {
              allowed_file_types: [".csv"]
            },
            on_success(file) {
              var data = frappe.utils.csv_to_array(
                frappe.utils.get_decoded_string(file.dataurl)
              );
              var fieldnames = data[2];
              me.frm.clear_table(me.df.fieldname);
              $.each(data, (i, row) => {
                if (i > 6) {
                  var blank_row = true;
                  $.each(row, function(ci, value) {
                    if (value) {
                      blank_row = false;
                      return false;
                    }
                  });
                  if (!blank_row) {
                    var d = me.frm.add_child(me.df.fieldname);
                    $.each(row, (ci, value) => {
                      var fieldname = fieldnames[ci];
                      var df = frappe.meta.get_docfield(
                        me.df.options,
                        fieldname
                      );
                      if (df) {
                        d[fieldnames[ci]] = value_formatter_map[df.fieldtype] ? value_formatter_map[df.fieldtype](value) : value;
                      }
                    });
                  }
                }
              });
              me.frm.refresh_field(me.df.fieldname);
              frappe.msgprint({
                message: __("Table updated"),
                title: __("Success"),
                indicator: "green"
              });
            }
          });
          return false;
        });
      }
    }
    setup_download() {
      let title = this.df.label || frappe.model.unscrub(this.df.fieldname);
      $(this.wrapper).find(".grid-download").removeClass("hidden").on("click", () => {
        var data = [];
        var docfields = [];
        data.push([__("Bulk Edit {0}", [title])]);
        data.push([]);
        data.push([]);
        data.push([]);
        data.push([__("The CSV format is case sensitive")]);
        data.push([__("Do not edit headers which are preset in the template")]);
        data.push(["------"]);
        $.each(frappe.get_meta(this.df.options).fields, (i, df) => {
          if (frappe.model.is_value_type(df.fieldtype)) {
            data[1].push(df.label);
            data[2].push(df.fieldname);
            let description = (df.description || "") + " ";
            if (df.fieldtype === "Date") {
              description += frappe.boot.sysdefaults.date_format;
            }
            data[3].push(description);
            docfields.push(df);
          }
        });
        $.each(this.frm.doc[this.df.fieldname] || [], (i, d) => {
          var row = [];
          $.each(data[2], (i2, fieldname) => {
            var value = d[fieldname];
            if (docfields[i2].fieldtype === "Date" && value) {
              value = frappe.datetime.str_to_user(value);
            }
            row.push(value || "");
          });
          data.push(row);
        });
        frappe.tools.downloadify(data, null, title);
        return false;
      });
    }
    add_custom_button(label, click, position = "bottom") {
      const $wrapper = position === "top" ? this.grid_custom_buttons : this.grid_buttons;
      let $btn = this.custom_buttons[label];
      if (!$btn) {
        $btn = $(`<button type="button" class="btn btn-secondary btn-xs btn-custom">`).html(__(label)).prependTo($wrapper).on("click", click);
        this.custom_buttons[label] = $btn;
      } else {
        $btn.removeClass("hidden");
      }
      return $btn;
    }
    clear_custom_buttons() {
      this.grid_buttons.find(".btn-custom").addClass("hidden");
    }
    update_docfield_property(fieldname, property, value) {
      if (!this.grid_rows) {
        return;
      }
      for (let row of this.grid_rows) {
        let docfield = row.docfields.find((d) => d.fieldname === fieldname);
        if (docfield) {
          docfield[property] = value;
        } else {
          throw `field ${fieldname} not found`;
        }
      }
      this.docfields.find((d) => d.fieldname === fieldname)[property] = value;
      if (this.user_defined_columns && this.user_defined_columns.length > 0) {
        let field = this.user_defined_columns.find((d) => d.fieldname === fieldname);
        if (field && Object.keys(field).includes(property)) {
          field[property] = value;
        }
      }
      this.debounced_refresh();
    }
  };

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/sales_order_tree_items.js
  (() => {
    const TREE_KEY = "__so_items_tree_state";
    const STYLE = `
    .so-tree-actions{
      position:absolute;
      left:6px;
      bottom:2px;
      display:inline-flex;
      gap:6px;
      align-items:center;
      font-weight:600;
      z-index:5;
      pointer-events:auto;
    }
    [data-fieldname="item_code"]{ position:relative; }

    .so-tree-btn{
      cursor:pointer;
      opacity:.65;
      user-select:none;
      padding:0 4px;
      border-radius:4px;
      line-height:1.2;
    }
    .so-tree-btn:hover{ opacity:1; }
  `;
    function ensureStyle() {
      if (document.getElementById("so-tree-style"))
        return;
      const el = document.createElement("style");
      el.id = "so-tree-style";
      el.innerHTML = STYLE;
      document.head.appendChild(el);
    }
    function ensureState(frm) {
      frm[TREE_KEY] || (frm[TREE_KEY] = { collapsed: /* @__PURE__ */ new Set(), labels: /* @__PURE__ */ new Map() });
      return frm[TREE_KEY];
    }
    function scheduleDecorate(frm) {
      if (frm.__so_tree_raf)
        return;
      frm.__so_tree_raf = requestAnimationFrame(() => {
        frm.__so_tree_raf = null;
        decorateGrid(frm);
      });
    }
    function genTreeId() {
      var _a;
      if ((_a = window.crypto) == null ? void 0 : _a.randomUUID)
        return crypto.randomUUID();
      return "t_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    function ensureTreeIds(frm) {
      let changed = false;
      (frm.doc.items || []).forEach((r) => {
        if (!r.tree_id) {
          r.tree_id = genTreeId();
          changed = true;
        }
        if (r.indent === void 0 || r.indent === null) {
          r.indent = 0;
        }
      });
      return changed;
    }
    function getChildrenMapByTreeId(items) {
      const children = /* @__PURE__ */ new Map();
      for (const it of items || []) {
        const pid = it.parent_tree_id || "";
        if (!children.has(pid))
          children.set(pid, []);
        children.get(pid).push(it);
      }
      for (const arr of children.values())
        arr.sort((a, b) => (a.idx || 0) - (b.idx || 0));
      return children;
    }
    function buildLabels(frm) {
      const state = ensureState(frm);
      state.labels = /* @__PURE__ */ new Map();
      const items = frm.doc.items || [];
      const children = getChildrenMapByTreeId(items);
      function walk(parentTreeId, prefix) {
        const kids = children.get(parentTreeId) || [];
        kids.forEach((k, i) => {
          const label = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
          state.labels.set(k.name, label);
          walk(k.tree_id, label);
        });
      }
      walk("", "");
    }
    function hasChildren(frm, row) {
      const tid = row.tree_id;
      if (!tid)
        return false;
      return (frm.doc.items || []).some((r) => r.parent_tree_id === tid);
    }
    function isHiddenByAncestor(frm, rowDoc) {
      const state = ensureState(frm);
      let pid = rowDoc.parent_tree_id;
      while (pid) {
        if (state.collapsed.has(pid))
          return true;
        const parentDoc = (frm.doc.items || []).find((r) => r.tree_id === pid);
        pid = parentDoc == null ? void 0 : parentDoc.parent_tree_id;
      }
      return false;
    }
    function toggleCollapse(frm, row) {
      const state = ensureState(frm);
      const tid = row.tree_id;
      if (!tid)
        return;
      if (state.collapsed.has(tid))
        state.collapsed.delete(tid);
      else
        state.collapsed.add(tid);
      scheduleDecorate(frm);
    }
    function normalizeTreeOrder(frm) {
      const items = frm.doc.items || [];
      if (!items.length)
        return false;
      const children = getChildrenMapByTreeId(items);
      const ordered = [];
      const walk = (parentTreeId) => {
        const kids = children.get(parentTreeId) || [];
        for (const k of kids) {
          ordered.push(k);
          walk(k.tree_id);
        }
      };
      walk("");
      if (ordered.length !== items.length)
        return false;
      let changed = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i] !== ordered[i]) {
          changed = true;
          break;
        }
      }
      if (!changed)
        return false;
      frm.doc.items = ordered;
      frm.doc.items.forEach((r, i) => r.idx = i + 1);
      return true;
    }
    function addChild(frm, parentRowName) {
      ensureTreeIds(frm);
      const items = frm.doc.items || [];
      const parent = items.find((r) => r.name === parentRowName);
      if (!parent)
        return;
      if (!parent.tree_id)
        parent.tree_id = genTreeId();
      const child = frm.add_child("items");
      child.tree_id = genTreeId();
      child.parent_tree_id = parent.tree_id;
      child.indent = (parent.indent || 0) + 1;
      normalizeTreeOrder(frm);
      frm.refresh_field("items");
      scheduleDecorate(frm);
    }
    function patchGridToReapplyTree(frm) {
      var _a;
      const grid = (_a = frm.fields_dict.items) == null ? void 0 : _a.grid;
      if (!grid || grid.__so_tree_patched)
        return;
      grid.__so_tree_patched = true;
      const wrap = (obj, fn) => {
        if (!obj || typeof obj[fn] !== "function")
          return;
        const orig = obj[fn].bind(obj);
        obj[fn] = function() {
          const out = orig(...arguments);
          scheduleDecorate(frm);
          return out;
        };
      };
      wrap(grid, "refresh");
      wrap(grid, "refresh_row");
      wrap(grid, "render_result");
    }
    function decorateGrid(frm) {
      var _a;
      ensureStyle();
      ensureTreeIds(frm);
      const grid = (_a = frm.fields_dict.items) == null ? void 0 : _a.grid;
      if (!grid)
        return;
      patchGridToReapplyTree(frm);
      buildLabels(frm);
      const state = ensureState(frm);
      if (!grid.wrapper.data("so-tree-bound")) {
        grid.wrapper.data("so-tree-bound", true);
        grid.wrapper.on("mousedown", ".so-tree-add, .so-tree-toggle", function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        });
        grid.wrapper.on("click", ".so-tree-add", function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const rowName = $(this).closest(".grid-row").attr("data-name");
          addChild(frm, rowName);
        });
        grid.wrapper.on("click", ".so-tree-toggle", function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const rowName = $(this).closest(".grid-row").attr("data-name");
          const row = (frm.doc.items || []).find((r) => r.name === rowName);
          if (row)
            toggleCollapse(frm, row);
        });
      }
      setTimeout(() => {
        (grid.grid_rows || []).forEach((gr) => {
          const d = gr.doc;
          gr.row.toggle(!isHiddenByAncestor(frm, d));
          const label = state.labels.get(d.name) || `${d.idx || ""}`;
          gr.row.find(".row-index").text(label);
          const indent = d.indent || 0;
          const $cell = gr.row.find('[data-fieldname="item_code"]');
          $cell.css("padding-left", `${indent * 18}px`);
          if (!$cell.find(".so-tree-actions").length) {
            $cell.append(`
            <span class="so-tree-actions">
              <span class="so-tree-btn so-tree-add" title="Add child">\uFF0B</span>
              <span class="so-tree-btn so-tree-toggle" title="Expand/Collapse">\u25BE</span>
            </span>
          `);
          }
          $cell.find(".so-tree-toggle").toggle(hasChildren(frm, d));
        });
      }, 0);
    }
    frappe.ui.form.on("Sales Order", {
      refresh(frm) {
        scheduleDecorate(frm);
      },
      items_add(frm) {
        scheduleDecorate(frm);
      },
      items_on_form_rendered(frm) {
        scheduleDecorate(frm);
      },
      before_save(frm) {
        const changed = ensureTreeIds(frm);
        if (changed)
          frm.refresh_field("items");
        normalizeTreeOrder(frm);
      },
      after_save(frm) {
        scheduleDecorate(frm);
      }
    });
  })();

  // ../frappe_enhanced_gridview/frappe_enhanced_gridview/public/js/enhanced_gridview.bundle.js
  var Custom_GridRow = class extends GridRow {
    validate_columns_width() {
      let total_column_width = 0;
      this.selected_columns_for_grid.forEach((row) => {
        if (row.columns && row.columns > 0) {
          total_column_width += cint(row.columns);
        }
      });
    }
    show_form() {
      super.show_form();
      $(this.grid.form_grid).removeClass("relative-important");
    }
    hide_form() {
      super.hide_form();
      $(this.grid.form_grid).addClass("relative-important");
    }
  };
  var Custom_Grid = class extends Grid {
    make() {
      let template = `
			<div class="grid-field">
				<label class="control-label">${__(this.df.label || "")}</label>
				<span class="help"></span>
				<p class="text-muted small grid-description"></p>
				<div class="grid-custom-buttons"></div>
				<div class="form-grid-container enhanced-grid-container">
					<div class="form-grid">
						<div class="grid-heading-row"></div>
						<div class="grid-body">
							<div class="rows"></div>
							<div class="grid-empty text-center">
								<img
									src="/assets/frappe/images/ui-states/grid-empty-state.svg"
									alt="Grid Empty State"
									class="grid-empty-illustration"
								>
								${__("No Data")}
							</div>
						</div>
					</div>
					<input type="range" min="1" max="100" value="1" class="enhanced-slider">
				</div>
				<div class="small form-clickable-section grid-footer">
					<div class="flex justify-between">
						<div class="grid-buttons">
							<button type="button" class="btn btn-xs btn-danger grid-remove-rows hidden"
								data-action="delete_rows">
								${__("Delete")}
							</button>
							<button type="button" class="btn btn-xs btn-danger grid-remove-all-rows hidden"
								data-action="delete_all_rows">
								${__("Delete All")}
							</button>
							<!-- hack to allow firefox include this in tabs -->
							<button type="button" class="btn btn-xs btn-secondary grid-add-row">
								${__("Add Row")}
							</button>
							<button type="button" class="grid-add-multiple-rows btn btn-xs btn-secondary hidden">
								${__("Add Multiple")}</a>
							</button>
						</div>
						<div class="grid-pagination">
						</div>
						<div class="grid-bulk-actions text-right">
							<button type="button" class="grid-download btn btn-xs btn-secondary hidden">
								${__("Download")}
							</button>
							<button type="button" class="grid-upload btn btn-xs btn-secondary hidden">
								${__("Upload")}
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
      this.wrapper = $(template).appendTo(this.parent);
      $(this.parent).addClass("form-group");
      this.set_grid_description();
      this.set_doc_url();
      frappe.utils.bind_actions_with_object(this.wrapper, this);
      this.form_grid = this.wrapper.find(".form-grid");
      this.form_grid.addClass("relative-important");
      this.form_grid_container = this.wrapper.find(".form-grid-container");
      this.enhanced_slider = this.wrapper.find(".enhanced-slider");
      let me = this;
      this.enhanced_slider.on("input", function(event) {
        const value = event.target.value;
        me.form_grid.css("left", `-${value}px`);
        me.setup_scrollable_width();
      });
      this.setup_add_row();
      this.setup_grid_pagination();
      this.custom_buttons = {};
      this.grid_buttons = this.wrapper.find(".grid-buttons");
      this.grid_custom_buttons = this.wrapper.find(".grid-custom-buttons");
      this.remove_rows_button = this.grid_buttons.find(".grid-remove-rows");
      this.remove_all_rows_button = this.grid_buttons.find(".grid-remove-all-rows");
      this.setup_allow_bulk_edit();
      this.setup_check();
      if (this.df.on_setup) {
        this.df.on_setup(this);
      }
    }
    make_head() {
      if (this.prevent_build)
        return;
      if (this.header_row) {
        $(this.parent).find(".grid-heading-row .grid-row").remove();
      }
      this.header_row = new Custom_GridRow({
        parent: $(this.parent).find(".grid-heading-row"),
        parent_df: this.df,
        docfields: this.docfields,
        frm: this.frm,
        grid: this,
        configure_columns: true
      });
      this.header_search = new Custom_GridRow({
        parent: $(this.parent).find(".grid-heading-row"),
        parent_df: this.df,
        docfields: this.docfields,
        frm: this.frm,
        grid: this,
        show_search: true
      });
      this.header_search.row.addClass("filter-row");
      if (this.header_search.show_search || this.header_search.show_search_row()) {
        $(this.parent).find(".grid-heading-row").addClass("with-filter");
      } else {
        $(this.parent).find(".grid-heading-row").removeClass("with-filter");
      }
      this.filter_applied && this.update_search_columns();
    }
    render_result_rows($rows, append_row) {
      let result_length = this.grid_pagination.get_result_length();
      let page_index = this.grid_pagination.page_index;
      let page_length = this.grid_pagination.page_length;
      if (!this.grid_rows) {
        return;
      }
      for (var ri = (page_index - 1) * page_length; ri < result_length; ri++) {
        var d = this.data[ri];
        if (!d) {
          return;
        }
        if (d.idx === void 0) {
          d.idx = ri + 1;
        }
        if (d.name === void 0) {
          d.name = "row " + d.idx;
        }
        let grid_row;
        if (this.grid_rows[ri] && !append_row) {
          grid_row = this.grid_rows[ri];
          grid_row.doc = d;
          grid_row.refresh();
        } else {
          grid_row = new Custom_GridRow({
            parent: $rows,
            parent_df: this.df,
            docfields: this.docfields,
            doc: d,
            frm: this.frm,
            grid: this
          });
          this.grid_rows[ri] = grid_row;
        }
        this.grid_rows_by_docname[d.name] = grid_row;
      }
    }
    setup_visible_columns() {
      if (this.visible_columns && this.visible_columns.length > 0)
        return;
      this.user_defined_columns = [];
      this.setup_user_defined_columns();
      var total_colsize = 1, fields = this.user_defined_columns && this.user_defined_columns.length > 0 ? this.user_defined_columns : this.editable_fields || this.docfields;
      this.visible_columns = [];
      for (var ci in fields) {
        var _df = fields[ci];
        df = this.user_defined_columns && this.user_defined_columns.length > 0 ? _df : this.fields_map[_df.fieldname];
        if (df && !df.hidden && (this.editable_fields || df.in_list_view) && (this.frm && this.frm.get_perm(df.permlevel, "read") || !this.frm) && !frappe.model.layout_fields.includes(df.fieldtype)) {
          if (df.columns) {
            df.colsize = df.columns;
          } else {
            this.update_default_colsize(df);
          }
          if (df.fieldtype == "Link" && !df.formatter && df.parent && frappe.meta.docfield_map[df.parent]) {
            const docfield = frappe.meta.docfield_map[df.parent][df.fieldname];
            if (docfield && docfield.formatter) {
              df.formatter = docfield.formatter;
            }
          }
          total_colsize += df.colsize;
          if (total_colsize > 100)
            return false;
          this.visible_columns.push([df, df.colsize]);
        }
      }
      var passes = 0;
      while (total_colsize < 11 && passes < 12) {
        for (var i in this.visible_columns) {
          var df = this.visible_columns[i][0];
          var colsize = this.visible_columns[i][1];
          if (colsize > 1 && colsize < 11 && frappe.model.is_non_std_field(df.fieldname)) {
            if (passes < 3 && ["Int", "Currency", "Float", "Check", "Percent"].indexOf(df.fieldtype) !== -1) {
              continue;
            }
            this.visible_columns[i][1] += 1;
            total_colsize++;
          }
          if (total_colsize > 10)
            break;
        }
        passes++;
      }
      this.setup_scrollable_width();
      this.verify_overflow_columns_width();
    }
    setup_scrollable_width() {
      let width = 200;
      this.visible_columns.forEach((column) => {
        width += column[1] * 50 + 100;
      });
      if (width > this.form_grid_container[0].clientWidth) {
        this.enhanced_slider.prop("max", width - this.form_grid_container[0].clientWidth);
        this.enhanced_slider.prop("style", "display:block");
      } else {
        this.form_grid.css("left", `0px`);
        this.enhanced_slider.prop("max", this.form_grid_container[0].clientWidth);
        this.enhanced_slider.prop("style", "display:none");
        this.enhanced_slider.prop("value", 0);
      }
    }
    verify_overflow_columns_width() {
      let width = 200;
      this.visible_columns.forEach((column) => {
        width += column[1] * 50 + 100;
      });
      if (width > this.form_grid_container[0].clientWidth) {
        this.form_grid_container.addClass("enhanced-grid-container");
        this.enhanced_slider.prop("style", "display:block");
      } else {
        this.enhanced_slider.prop("style", "display:none");
        this.enhanced_slider.prop("value", 0);
      }
    }
  };
  frappe.ui.form.ControlTable = class CustomControlTable extends frappe.ui.form.ControlTable {
    make() {
      super.make();
      this.grid = new Custom_Grid({
        frm: this.frm,
        df: this.df,
        parent: this.wrapper,
        control: this
      });
    }
  };
})();
//# sourceMappingURL=enhanced_gridview.bundle.O5DR3LLY.js.map
