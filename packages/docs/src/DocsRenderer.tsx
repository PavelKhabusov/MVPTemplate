import React, { type ReactNode } from 'react'
import { Platform, ScrollView, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { Renderer } from 'react-native-marked'

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, monospace',
})

const COLORS = {
  bg: '#0d1117',
  titleBar: '#1a1a2e',
  text: '#e6edf3',
  titleText: '#888',
  dotRed: '#FF5F57',
  dotYellow: '#FEBC2E',
  dotGreen: '#28C840',
}

function WindowDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.dotRed }} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.dotYellow }} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.dotGreen }} />
    </View>
  )
}

export class DocsRenderer extends Renderer {
  code(
    text: string,
    language?: string,
    _containerStyle?: ViewStyle,
    _textStyle?: TextStyle,
  ): ReactNode {
    const label = language || 'code'

    return (
      <View
        key={this.getKey()}
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          marginVertical: 4,
        }}
      >
        {/* Title bar */}
        <View
          style={{
            backgroundColor: COLORS.titleBar,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
          }}
        >
          <WindowDots />
          <Text
            style={{
              fontFamily: MONO_FONT,
              fontSize: 12,
              color: COLORS.titleText,
            }}
          >
            {label}
          </Text>
        </View>

        {/* Code content */}
        <ScrollView
          horizontal
          contentContainerStyle={{
            backgroundColor: COLORS.bg,
            padding: 16,
            minWidth: '100%' as any,
          }}
        >
          <View>
            <Text
              selectable
              style={{
                fontFamily: MONO_FONT,
                fontSize: 13,
                lineHeight: 20,
                color: COLORS.text,
              }}
            >
              {text}
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  codespan(text: string, styles?: TextStyle): ReactNode {
    return (
      <Text
        selectable
        key={this.getKey()}
        style={[
          {
            fontFamily: MONO_FONT,
            fontSize: 14,
            borderRadius: 4,
            paddingHorizontal: 5,
            paddingVertical: 2,
          },
          styles,
        ] as any}
      >
        {text}
      </Text>
    )
  }

  table(
    header: ReactNode[][],
    rows: ReactNode[][][],
    tableStyle?: ViewStyle,
    rowStyle?: ViewStyle,
    cellStyle?: ViewStyle,
  ): React.ReactNode {
    const colCount = header.length
    const minColWidth = 160
    const colWidth = Math.max(minColWidth, 200)

    const cellBase: ViewStyle = {
      width: colWidth,
      padding: 10,
      borderRightWidth: 1,
      borderRightColor: (tableStyle?.borderColor as string) ?? '#ccc',
      ...cellStyle,
    }

    const rowBase: ViewStyle = {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: (tableStyle?.borderColor as string) ?? '#ccc',
      ...rowStyle,
    }

    const noWrap: any = Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}

    return (
      <ScrollView horizontal key={this.getKey()} showsHorizontalScrollIndicator>
        <View style={{
          borderWidth: tableStyle?.borderWidth ?? 1,
          borderColor: (tableStyle?.borderColor as string) ?? '#ccc',
          borderRadius: 6,
          overflow: 'hidden',
          minWidth: colCount * colWidth,
        }}>
          {/* Header */}
          <View style={{ ...rowBase, backgroundColor: 'rgba(128,128,128,0.1)' }}>
            {header.map((col, i) => (
              <View key={i} style={{ ...cellBase, borderRightWidth: i < colCount - 1 ? 1 : 0 }}>
                <View style={noWrap}>{col}</View>
              </View>
            ))}
          </View>
          {/* Rows */}
          {rows.map((row, ri) => (
            <View key={ri} style={{ ...rowBase, borderBottomWidth: ri < rows.length - 1 ? 1 : 0 }}>
              {row.map((cell, ci) => (
                <View key={ci} style={{ ...cellBase, borderRightWidth: ci < colCount - 1 ? 1 : 0 }}>
                  <View style={noWrap}>{cell}</View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    )
  }
}
