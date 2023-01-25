import { Button } from "@dashboard/components/Button";
import FilterBar from "@dashboard/components/FilterBar";
import PageHeader from "@dashboard/components/PageHeader";
import { OrderDraftListQuery, RefreshLimitsQuery } from "@dashboard/graphql";
import { sectionNames } from "@dashboard/intl";
import { OrderDraftListUrlSortField } from "@dashboard/orders/urls";
import {
  FilterPageProps,
  ListActions,
  PageListProps,
  RelayToFlat,
  SortPage,
  TabPageProps,
} from "@dashboard/types";
import { hasLimits, isLimitReached } from "@dashboard/utils/limits";
import { Card } from "@material-ui/core";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import OrderDraftList from "../OrderDraftList";
import OrderLimitReached from "../OrderLimitReached";
import {
  createFilterStructure,
  OrderDraftFilterKeys,
  OrderDraftListFilterOpts,
} from "./filters";

export interface OrderDraftListPageProps
  extends PageListProps,
    ListActions,
    FilterPageProps<OrderDraftFilterKeys, OrderDraftListFilterOpts>,
    SortPage<OrderDraftListUrlSortField>,
    TabPageProps {
  limits: RefreshLimitsQuery["shop"]["limits"];
  orders: RelayToFlat<OrderDraftListQuery["draftOrders"]>;
  onAdd: () => void;
}

const OrderDraftListPage: React.FC<OrderDraftListPageProps> = ({
  currentTab,
  disabled,
  filterOpts,
  initialSearch,
  limits,
  onAdd,
  onAll,
  onFilterChange,
  onSearchChange,
  onTabChange,
  onTabDelete,
  onTabSave,
  tabs,
  ...listProps
}) => {
  const intl = useIntl();
  const structure = createFilterStructure(intl, filterOpts);
  const limitsReached = isLimitReached(limits, "orders");

  return (
    <>
      <PageHeader
        title={intl.formatMessage(sectionNames.draftOrders)}
        limitText={
          hasLimits(limits, "orders") &&
          intl.formatMessage(
            {
              id: "w2eTzO",
              defaultMessage: "{count}/{max} orders",
              description: "placed orders counter",
            },
            {
              count: limits.currentUsage.orders,
              max: limits.allowedUsage.orders,
            },
          )
        }
      >
        <Button
          variant="primary"
          disabled={disabled || limitsReached}
          onClick={onAdd}
        >
          <FormattedMessage
            id="LshEVn"
            defaultMessage="Create order"
            description="button"
          />
        </Button>
      </PageHeader>
      {limitsReached && <OrderLimitReached />}
      <Card>
        <FilterBar
          allTabLabel={intl.formatMessage({
            id: "7a1S4K",
            defaultMessage: "All Drafts",
            description: "tab name",
          })}
          currentTab={currentTab}
          filterStructure={structure}
          initialSearch={initialSearch}
          searchPlaceholder={intl.formatMessage({
            id: "NJEe12",
            defaultMessage: "Search Draft",
          })}
          tabs={tabs}
          onAll={onAll}
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
          onTabChange={onTabChange}
          onTabDelete={onTabDelete}
          onTabSave={onTabSave}
        />
        <OrderDraftList disabled={disabled} {...listProps} />
      </Card>
    </>
  );
};
OrderDraftListPage.displayName = "OrderDraftListPage";
export default OrderDraftListPage;
