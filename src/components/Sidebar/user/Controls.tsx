import { useUser } from "@dashboard/auth";
import { isDarkTheme } from "@dashboard/misc";
import { staffMemberDetailsUrl } from "@dashboard/staff/urls";
import { useTheme } from "@dashboard/theme";
import { useTheme as useLegacyTheme } from "@saleor/macaw-ui";
import {
  Button,
  Dropdown,
  List,
  MoreOptionsIcon,
  sprinkles,
  Text,
} from "@saleor/macaw-ui/next";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

import { ThemeSwitcher } from "./ThemeSwitcher";

export const UserControls = () => {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const { themeType: legacyThemeType, setTheme: setLegacyTheme } =
    useLegacyTheme();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button
          variant="tertiary"
          icon={<MoreOptionsIcon />}
          data-test-id="userMenu"
        />
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
        <List
          padding={3}
          borderRadius={3}
          boxShadow="overlay"
          backgroundColor="surfaceNeutralPlain"
        >
          <Dropdown.Item>
            <List.Item borderRadius={3} data-test-id="account-settings-button">
              <Link
                to={staffMemberDetailsUrl(user?.id)}
                className={sprinkles({
                  display: "block",
                  width: "100%",
                  ...listItemStyles,
                })}
              >
                <Text>
                  <FormattedMessage
                    id="NQgbYA"
                    defaultMessage="Account Settings"
                  />
                </Text>
              </Link>
            </List.Item>
          </Dropdown.Item>
          <Dropdown.Item data-test-id="log-out-button">
            <List.Item onClick={logout} {...listItemStyles}>
              <Text>
                <FormattedMessage
                  id="qLbse5"
                  defaultMessage="Log out"
                  description="button"
                />
              </Text>
            </List.Item>
          </Dropdown.Item>
          <Dropdown.Item>
            <List.Item
              display="flex"
              alignItems="center"
              gap={5}
              marginTop={3}
              onClick={() => {
                setLegacyTheme(isDarkTheme(legacyThemeType) ? "light" : "dark");
                setTheme(
                  theme === "defaultLight" ? "defaultDark" : "defaultLight",
                );
              }}
              {...listItemStyles}
              data-test-id="theme-switch"
            >
              <ThemeSwitcher theme={theme} />
            </List.Item>
          </Dropdown.Item>
        </List>
      </Dropdown.Content>
    </Dropdown>
  );
};

const listItemStyles = {
  paddingX: 3,
  paddingY: 4,
  borderRadius: 3,
} as const;
