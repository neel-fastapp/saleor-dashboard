import { Box, List } from "@saleor/macaw-ui/next";
import React from "react";

import { MenuItem } from "./Item";
import { useMenuStructure } from "./useMenuStructure";

export const Menu = () => {
  const menuStructure = useMenuStructure();

  return (
    <Box padding={5}>
      <List as="ol">
        {menuStructure.map(menuItem => (
          <MenuItem menuItem={menuItem} key={menuItem.id} />
        ))}
      </List>
    </Box>
  );
};
