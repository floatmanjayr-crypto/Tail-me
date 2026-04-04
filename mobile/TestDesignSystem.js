// ============================================================
// TestDesignSystem.js — Live Preview
// ============================================================

import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Badge,
  Row,
  Stack,
  Pill,
  Avatar,
  Divider,
  StatBox,
  SectionHeader,
  EmptyState,
} from "./components/UI";
import { DARK, SPACING as S } from "./design/tokens";

export default function TestDesignSystem() {
  const C = DARK;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.lg }}>
        <Stack spacing={S.xl}>
          {/* Typography */}
          <Card colors={C} variant="glass">
            <Stack spacing={S.sm}>
              <Text variant="label" color={C.dim}>Typography</Text>
              <Text variant="hero" color={C.text}>Hero Text</Text>
              <Text variant="h1" color={C.text}>Heading 1</Text>
              <Text variant="h2" color={C.text}>Heading 2</Text>
              <Text variant="h3" color={C.text}>Heading 3</Text>
              <Text variant="body" color={C.muted}>
                Body text with proper line height and spacing for readability.
              </Text>
              <Text variant="caption" color={C.dim}>Caption text</Text>
              <Text variant="tiny" color={C.faint}>Tiny text</Text>
            </Stack>
          </Card>

          {/* Buttons */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Buttons</Text>
            <Button title="Primary Button" variant="primary" colors={C} />
            <Button title="Secondary" variant="secondary" colors={C} />
            <Button title="Danger" variant="danger" colors={C} />
            <Button title="Success" variant="success" colors={C} />
            <Button title="Ghost" variant="ghost" colors={C} />
            <Row spacing={S.sm}>
              <Button title="Small" variant="primary" size="sm" colors={C} />
              <Button title="Medium" variant="primary" size="md" colors={C} />
            </Row>
          </Stack>

          {/* Badges */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Badges</Text>
            <Row spacing={S.sm}>
              <Badge label="LOOK" icon="👀" color="#8B5CF6" />
              <Badge label="NOW" icon="⚡" color="#EF4444" />
              <Badge label="DROP" icon="💧" color="#F59E0B" />
              <Badge label="PRO" icon="⭐" color="#10B981" variant="outline" />
            </Row>
          </Stack>

          {/* Pills */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Pills / Chips</Text>
            <Row spacing={S.sm} wrap>
              <Pill label="For You" icon="✨" selected colors={C} />
              <Pill label="Trending" icon="🔥" colors={C} />
              <Pill label="Nearby" icon="📍" colors={C} />
              <Pill label="Following" icon="👥" colors={C} />
            </Row>
          </Stack>

          {/* Cards */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Cards</Text>
            <Card variant="default" colors={C}>
              <Text variant="body" color={C.text}>Default Card</Text>
            </Card>
            <Card variant="glass" colors={C}>
              <Text variant="body" color={C.text}>Glass Card</Text>
            </Card>
            <Card variant="brand" colors={C}>
              <Text variant="body" color={C.brand}>Brand Card</Text>
            </Card>
          </Stack>

          {/* Stats */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Stats</Text>
            <Row spacing={S.sm}>
              <StatBox value="247" label="Caught" icon="🎯" colors={C} />
              <StatBox value="12" label="Streak" icon="🔥" color={C.amber} colors={C} />
              <StatBox value="$42" label="Earned" icon="💰" color={C.green} colors={C} />
            </Row>
          </Stack>

          {/* Avatars */}
          <Stack spacing={S.md}>
            <Text variant="label" color={C.dim}>Avatars</Text>
            <Row spacing={S.sm}>
              <Avatar name="Alice" size={40} />
              <Avatar name="Bob" size={50} />
              <Avatar name="Charlie" size={60} borderColor={C.brand} />
            </Row>
          </Stack>

          {/* Section Header */}
          <SectionHeader
            title="Recent Activity"
            subtitle="Your latest catches"
            action="View All"
            colors={C}
          />

          {/* Empty State */}
          <Card colors={C} variant="glass">
            <EmptyState
              icon="🎁"
              title="No items"
              subtitle="You haven't caught any tails yet"
              action="Start Catching"
              colors={C}
            />
          </Card>

          <View style={{ height: 40 }} />
        </Stack>
      </ScrollView>
    </SafeAreaView>
  );
}
