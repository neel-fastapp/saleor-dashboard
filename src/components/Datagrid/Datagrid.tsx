import "@glideapps/glide-data-grid/dist/index.css";

import { usePreventHistoryBack } from "@dashboard/hooks/usePreventHistoryBack";
import DataEditor, {
  DataEditorRef,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridSelection,
  HeaderClickedEventArgs,
  Item,
} from "@glideapps/glide-data-grid";
import { Card, CardContent, Typography } from "@material-ui/core";
import { useTheme } from "@saleor/macaw-ui";
import clsx from "clsx";
import range from "lodash/range";
import throttle from "lodash/throttle";
import React, { ReactElement } from "react";
import { FormattedMessage } from "react-intl";

import { CardMenuItem } from "../CardMenu";
import ColumnPicker, { ColumnPickerProps } from "../ColumnPicker";
import { FullScreenContainer } from "./FullScreenContainer";
import { Header } from "./Header";
import { headerIcons } from "./headerIcons";
import { RowActions } from "./RowActions";
import useStyles, { useDatagridTheme, useFullScreenStyles } from "./styles";
import { AvailableColumn } from "./types";
import useCells from "./useCells";
import useColumns from "./useColumns";
import useDatagridChange, {
  DatagridChange,
  OnDatagridChange,
} from "./useDatagridChange";
import { useDefaultColumnPickerProps } from "./useDefaultColumnPickerProps";
import { useFullScreenMode } from "./useFullScreenMode";
import { usePortalClasses } from "./usePortalClasses";

export interface GetCellContentOpts {
  changes: React.MutableRefObject<DatagridChange[]>;
  added: number[];
  removed: number[];
  getChangeIndex: (column: string, row: number) => number;
}

export interface MenuItemsActions {
  removeRows: (indexes: number[]) => void;
}

export interface DatagridProps {
  addButtonLabel: string;
  availableColumns: readonly AvailableColumn[];
  emptyText: string;
  getCellError: (item: Item, opts: GetCellContentOpts) => boolean;
  getCellContent: (item: Item, opts: GetCellContentOpts) => GridCell;
  menuItems: (index: number) => CardMenuItem[];
  rows: number;
  title: string;
  fullScreenTitle?: string;
  selectionActions: (
    selection: number[],
    actions: MenuItemsActions,
  ) => React.ReactNode;
  onChange?: OnDatagridChange;
  onHeaderClicked?: (colIndex: number, event: HeaderClickedEventArgs) => void;
  renderColumnPicker?: (
    defaultProps: Partial<ColumnPickerProps>,
  ) => ReactElement;
}

export const Datagrid: React.FC<DatagridProps> = ({
  addButtonLabel,
  availableColumns,
  emptyText,
  getCellContent,
  getCellError,
  menuItems,
  rows,
  selectionActions,
  title,
  fullScreenTitle,
  onHeaderClicked,
  onChange,
  renderColumnPicker,
}): React.ReactElement => {
  const classes = useStyles();
  const fullScreenClasses = useFullScreenStyles(classes);
  const datagridTheme = useDatagridTheme();
  const editor = React.useRef<DataEditorRef>();

  const { isOpen, isAnimationOpenFinished, toggle } = useFullScreenMode();

  usePortalClasses({ className: classes.portal });

  const defaultColumnPickerProps =
    useDefaultColumnPickerProps(availableColumns);

  const { columns, onColumnMoved, onColumnResize } =
    useColumns(availableColumns);

  const {
    added,
    onCellEdited,
    onRowsRemoved,
    changes,
    removed,
    getChangeIndex,
    onRowAdded,
  } = useDatagridChange(availableColumns, rows, onChange);

  const theme = useTheme();

  const [scrolledToRight, setScrolledToRight] = React.useState(false);
  const scroller: HTMLDivElement = document.querySelector(".dvn-scroller");
  const scrollerInner: HTMLDivElement =
    document.querySelector(".dvn-scroll-inner");

  usePreventHistoryBack(scroller);

  React.useEffect(() => {
    if (!(scroller && scrollerInner)) {
      return;
    }

    const handler = throttle(() => {
      const isScrolledToRight =
        scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft < 2;
      setScrolledToRight(isScrolledToRight);
    }, 100);
    scroller.addEventListener("scroll", handler);

    return () => scroller.removeEventListener("scroll", handler);
  }, [scroller, scrollerInner]);

  const getCellContentEnh = React.useCallback(
    ([column, row]: Item): GridCell => {
      if (
        !availableColumns[column]?.id ||
        !columns[column]?.id ||
        column === -1
      ) {
        return {
          kind: GridCellKind.Loading,
          allowOverlay: false,
        };
      }

      const item = [
        availableColumns.findIndex(ac => ac.id === columns[column].id),
        row,
      ] as const;
      const opts = { changes, added, removed, getChangeIndex };

      const columnId = availableColumns[column].id;
      const changed = !!changes.current[getChangeIndex(columnId, row)]?.data;

      return {
        ...getCellContent(item, opts),
        ...(changed
          ? { themeOverride: { bgCell: theme.palette.saleor.active[5] } }
          : {}),
        ...(getCellError(item, opts)
          ? {
              themeOverride: {
                bgCell:
                  theme.palette.saleor.theme === "light"
                    ? theme.palette.saleor.fail.light
                    : theme.palette.saleor.errorAction[5],
              },
            }
          : {}),
      };
    },
    [
      availableColumns,
      changes,
      added,
      removed,
      getChangeIndex,
      getCellContent,
      theme.palette.saleor.active,
      theme.palette.saleor.theme,
      theme.palette.saleor.fail.light,
      theme.palette.saleor.errorAction,
      getCellError,
      columns,
    ],
  );

  const onCellEditedEnh = React.useCallback(
    ([column, row]: Item, newValue: EditableGridCell): void => {
      onCellEdited(
        [availableColumns.findIndex(ac => ac.id === columns[column].id), row],
        newValue,
      );
      editor.current.updateCells(
        range(columns.length).map(offset => ({
          cell: [column + offset, row],
        })),
      );
    },
    [onCellEdited, getCellContent, availableColumns, columns],
  );

  const [selection, setSelection] = React.useState<GridSelection>();

  const props = useCells();

  const removeRows = React.useCallback(
    (rows: number[]) => {
      if (selection?.rows) {
        onRowsRemoved(rows);
        setSelection(undefined);
      }
    },
    [selection, onRowsRemoved],
  );

  const selectionActionsComponent = React.useMemo(
    () =>
      selection?.rows.length > 0
        ? selectionActions(Array.from(selection.rows), { removeRows })
        : null,
    [selection, selectionActions, removeRows],
  );

  const rowsTotal = rows - removed.length + added.length;
  const hasColumnGroups = columns.some(col => col.group);
  const headerTitle = isAnimationOpenFinished
    ? fullScreenTitle ?? title
    : title;

  return (
    <FullScreenContainer
      open={isOpen}
      className={fullScreenClasses.fullScreenContainer}
    >
      <Card className={classes.root}>
        <Header title={headerTitle}>
          <Header.ButtonFullScreen isOpen={isOpen} onToggle={toggle}>
            {isOpen ? (
              <FormattedMessage
                id="QjPJ78"
                defaultMessage="Close"
                description="close full-screen"
              />
            ) : (
              <FormattedMessage
                id="483Xnh"
                defaultMessage="Open"
                description="open full-screen"
              />
            )}
          </Header.ButtonFullScreen>
          <Header.ButtonAddRow onAddRow={onRowAdded}>
            {addButtonLabel}
          </Header.ButtonAddRow>
        </Header>
        <CardContent classes={{ root: classes.cardContentRoot }}>
          {rowsTotal > 0 ? (
            <>
              {selection?.rows.length > 0 && (
                <div className={classes.actionBtnBar}>
                  {selectionActionsComponent}
                </div>
              )}
              <div className={classes.editorContainer}>
                <DataEditor
                  {...props}
                  headerIcons={headerIcons}
                  theme={datagridTheme}
                  className={classes.datagrid}
                  getCellContent={getCellContentEnh}
                  onCellEdited={onCellEditedEnh}
                  columns={availableColumns}
                  rows={rowsTotal}
                  freezeColumns={1}
                  smoothScrollX
                  rowMarkers="checkbox"
                  rowSelect="multi"
                  rowSelectionMode="multi"
                  rangeSelect="multi-rect"
                  columnSelect="none"
                  getCellsForSelection
                  onColumnMoved={onColumnMoved}
                  onColumnResize={onColumnResize}
                  onHeaderClicked={onHeaderClicked}
                  onGridSelectionChange={setSelection}
                  gridSelection={selection}
                  rowHeight={48}
                  headerHeight={48}
                  ref={editor}
                  onPaste
                  rightElementProps={{
                    sticky: true,
                  }}
                  rightElement={
                    <div
                      className={clsx(classes.rowActionBar, {
                        [classes.rowActionBarScrolledToRight]: scrolledToRight,
                      })}
                    >
                      <div
                        className={clsx(classes.rowActionBarShadow, {
                          [classes.rowActionBarShadowActive]: !scrolledToRight,
                        })}
                      />
                      <div className={classes.columnPicker}>
                        {renderColumnPicker ? (
                          renderColumnPicker({
                            IconButtonProps: {
                              className: classes.ghostIcon,
                              variant: "ghost",
                              hoverOutline: false,
                            },
                          })
                        ) : (
                          <ColumnPicker
                            IconButtonProps={{
                              className: classes.ghostIcon,
                              variant: "ghost",
                              hoverOutline: false,
                            }}
                            {...defaultColumnPickerProps}
                          />
                        )}
                      </div>
                      {hasColumnGroups && (
                        <div
                          className={clsx(classes.rowAction, {
                            [classes.rowActionScrolledToRight]: scrolledToRight,
                          })}
                        />
                      )}
                      {Array(rowsTotal)
                        .fill(0)
                        .map((_, index) => (
                          <RowActions
                            menuItems={menuItems(index)}
                            disabled={index >= rowsTotal - added.length}
                          />
                        ))}
                    </div>
                  }
                  rowMarkerWidth={48}
                />
                {/* FIXME: https://github.com/glideapps/glide-data-grid/issues/505 */}
                {hasColumnGroups && (
                  <div className={classes.columnGroupFixer} />
                )}
              </div>
            </>
          ) : (
            <Typography align="center">{emptyText}</Typography>
          )}
        </CardContent>
      </Card>
    </FullScreenContainer>
  );
};

Datagrid.displayName = "Datagrid";
export default Datagrid;
