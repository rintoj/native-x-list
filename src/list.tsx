/* eslint-disable react-hooks/exhaustive-deps */
import groupByFn from 'lodash/groupBy'
import { Spinner } from 'native-x-spinner'
import { Stack } from 'native-x-stack'
import { Tappable } from 'native-x-tappable'
import { Text } from 'native-x-text'
import { COLOR, ContainerStyleProps, useContainerStyle, useTheme } from 'native-x-theme'
import React, {
  Fragment,
  ReactElement,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import { styles as s } from 'tachyons-react-native'
import { useCombinedRefs } from './utils'

export type ListRendererFn<S> = (item: S, index?: number) => ReactElement | null

const ON_END_REACHED_THRESHOLD = 0.5
const SCROLL_EVENT_THROTTLE = 16

const styles = {
  container: [s.flex],
  footer: [s.theme.shadowBg, s.pa3],
  contentContainerStyle: [s.pt2, s.theme.shadowBg],
  padding: {
    all: {
      'x-large': s.pa5,
      'x-small': s.pa1,
      large: s.pa4,
      none: s.pa0,
      normal: s.pa3,
      small: s.pa2,
    },
    horizontal: {
      'x-large': s.ph5,
      'x-small': s.ph1,
      large: s.ph4,
      none: s.ph0,
      normal: s.ph3,
      small: s.ph2,
    },
    vertical: {
      'x-large': s.pv5,
      'x-small': s.pv1,
      large: s.pv4,
      none: s.pv0,
      normal: s.pv3,
      small: s.pv2,
    },
  },
  itemContainer: [s.flex, s.flexRow, s.justifyCenter],
}

/**
 * minIndexForVisible — Minimum child items needed before adjusting self
 */
const maintainVisibleContentPosition = { minIndexForVisible: 0 }

const ERROR_TYPE = '__ERROR__'

const errorItem: any = (error: string) => ({ id: ERROR_TYPE, type: ERROR_TYPE, error })

function useChildrenWithHeaderAndFooter<S>(
  children: ReactNode[],
): [ReactNode[] | null, ListRendererFn<S>, ReactNode[] | null] {
  const before: ReactNode[] = []
  const after: ReactNode[] = []
  let renderer!: ListRendererFn<S>
  const ids = Object.keys(children as any)
  if (ids.length === 0) {
    return [null, (children as any) as ListRendererFn<S>, null]
  }
  ids.forEach(id => {
    const child = (children as any)[id]
    if (typeof child === 'function') {
      renderer = child
    } else if (renderer == undefined) {
      before.push(child)
    } else {
      after.push(child)
    }
  })
  return [before, renderer, after]
}

export interface ListProps<S> extends ContainerStyleProps {
  items: S[]
  inverted?: boolean
  separator?: ReactNode
  children: ListRendererFn<S> | Array<ReactElement | ListRendererFn<S> | null>
  keyExtractor?: ((item: S) => string) | string
  groupBy?: ((item: S) => string) | string
  searchBy?: ((item: S) => string) | string
  searchText?: string
  loading?: boolean
  disabled?: boolean
  isRefreshing?: boolean
  horizontal?: boolean
  divider?: boolean
  stickySectionHeadersEnabled?: boolean
  error?: string
  style?: StyleProp<ViewStyle>
  fill?: boolean
  emptyMessage?: { title: string; message: string } | (() => ReactElement | null)
  numColumns?: number
  showScrollIndicator?: boolean
  columnWrapperStyle?: StyleProp<ViewStyle>
  onSelectItem?: (props: { item: S; index?: number }) => void
  onRefresh?: () => void
  onFetchNext?: () => void
  onScrollToTopChange?: (scrollToTop: () => void) => void
  renderSectionHeader?: (title: string) => ReactElement | null
  onScroll?: (e?: NativeSyntheticEvent<NativeScrollEvent>) => void
  maintainVisibleContent?: boolean
}

function ListComponent<S>({
  items,
  children,
  separator,
  keyExtractor,
  divider,
  horizontal,
  inverted,
  groupBy,
  searchBy,
  searchText,
  style,
  onSelectItem,
  error,
  emptyMessage,
  loading,
  isRefreshing = false,
  onRefresh,
  onFetchNext,
  numColumns,
  fill = false,
  disabled = false,
  onScrollToTopChange,
  showScrollIndicator = true,
  columnWrapperStyle,
  onScroll,
  stickySectionHeadersEnabled,
  maintainVisibleContent,
  ...props
}: ListProps<S>, ref?: Ref<FlatList<S>> | Ref<SectionList<S>>,) {
  const listRef = useCombinedRefs<FlatList<S>>([(ref as Ref<FlatList<S>>) || null])
  const sectionListRef = useCombinedRefs<SectionList<S>>([(ref as Ref<SectionList<S>>) || null])
  const [visibleItems, setVisibleItems] = useState(items)
  const { getColor } = useTheme()
  const dividerColor = getColor?.(COLOR.DIVIDER)
  const containerStyle = useContainerStyle(props)

  const idExtractor = useCallback(
    (item: any) =>
      typeof keyExtractor === 'function' ? keyExtractor(item) : item[keyExtractor || 'id'],
    [keyExtractor],
  )

  useEffect(() => {
    if (!onScrollToTopChange) {
      return
    }
    onScrollToTopChange(() => {
      const currentSectionList = sectionListRef.current
      const currentList = listRef.current
      if (currentSectionList && currentSectionList.scrollToLocation) {
        currentSectionList.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true })
      } else if (currentList) {
        currentList.scrollToOffset({ offset: 0, animated: true })
      }
    })
  }, [onScrollToTopChange])

  const sections = useMemo(() => {
    if (groupBy == undefined) {
      return undefined
    }
    const groups = groupByFn(visibleItems, groupBy)
    return Object.keys(groups).map(title => ({
      title: title === 'undefined' ? '' : title,
      data: groups[title],
    }))
  }, [visibleItems, groupBy])

  const renderItemContainer: ViewStyle = useMemo(() => {
    return numColumns ? ([styles.itemContainer, { flex: 1 / numColumns }] as any) : ([] as any)
  }, [numColumns])

  const [listHeader, renderFunction, listFooter] = useChildrenWithHeaderAndFooter<S>(
    children as any,
  )

  const renderItem = useCallback(
    ({ item, index }: { item: S | ReturnType<typeof errorItem>; index: number }) => {
      if ((item as ReturnType<typeof errorItem>).type === ERROR_TYPE) {
        return (
          <Stack alignCenter alignMiddle fill padding='normal'>
            <Text textColor={COLOR.ERROR} alignCenter>
              {(item as ReturnType<typeof errorItem>).error}
            </Text>
          </Stack>
        )
      }
      if (renderFunction == undefined) {
        return null
      }
      return (
        <Tappable style={renderItemContainer} data={{ item, index }} onTap={onSelectItem as any}>
          {renderFunction(item, index)}
        </Tappable>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    const hasSearchText = searchBy != undefined && searchText !== ''
    const exp = new RegExp(searchText || '', 'i')

    setVisibleItems(
      (items || [])
        .filter((item: any) => {
          if (!hasSearchText || !searchBy) {
            return true
          }
          return exp.test(
            typeof searchBy === 'function' ? searchBy(item) : item[searchBy as any] || '',
          )
        })
        .concat(!loading && error != undefined ? errorItem(error) : undefined)
        .filter(i => i != null),
    )
  }, [items, loading, error, isRefreshing, searchBy, searchText])

  const contentContainerStyle = useMemo(
    () => [containerStyle, ...(horizontal ? [s.h100] : [s.w100, s.center])],
    [horizontal],
  )

  const renderItemSeparator = useCallback((): any => {
    if (separator) {
      return separator
    }
    if (!divider) {
      return null
    }
    const style = horizontal
      ? { borderBottomWidth: 1, borderWith: 0, width: '100%', borderBottomColor: dividerColor }
      : { borderLeftWidth: 1, borderWith: 0, height: '100%', borderLeftColor: dividerColor }
    return <View style={style} />
  }, [separator, divider, horizontal, dividerColor])

  let list: ReactElement

  const ListHeaderComponent = useMemo(
    () => (listHeader ? <Fragment key='header'>{listHeader}</Fragment> : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children],
  )
  const ListFooterComponent = useMemo(
    () => {
      return (
        <Fragment key='footer'>
          {loading && !isRefreshing ? (
            <Stack key='loader' fillHorizontal alignMiddle alignCenter padding='normal'>
              <Spinner />
            </Stack>
          ) : null}
          {listFooter ? <Fragment>{listFooter}</Fragment> : null}
        </Fragment>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, loading, isRefreshing],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title } }) => {
      if (title == undefined) {
        return null
      }
      if (props.renderSectionHeader) {
        return props.renderSectionHeader(title)
      }
      return (
        <Stack padding='normal'>
          <Text textColor={COLOR.TERTIARY}>{title}</Text>
        </Stack>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.renderSectionHeader],
  )

  const renderSectionFooter = !props.renderSectionHeader
    ? () => <View style={styles.footer} />
    : () => null

  const scrollIndicatorInsets = useMemo(() => {
    return horizontal ? { bottom: 1 } : { right: 1 }
  }, [horizontal])

  const renderEmptyComponent = useCallback(() => {
    if (emptyMessage == undefined || loading) {
      return null
    }
    if (typeof emptyMessage === 'function') {
      return emptyMessage()
    }
    return (
      <Stack fill alignCenter alignMiddle padding='normal'>
        {emptyMessage?.title != null ? (
          <Text bold fontSize='normal' alignCenter textColor={COLOR.TERTIARY}>
            {emptyMessage.title}
          </Text>
        ) : null}
        {emptyMessage?.message != null ? (
          <Stack fill alignCenter alignMiddle padding={['horizontal:large', 'vertical:small']}>
            <Text fontSize='small' alignCenter textColor={COLOR.TERTIARY}>
              {emptyMessage.message}
            </Text>
          </Stack>
        ) : null}
      </Stack>
    )
  }, [emptyMessage])

  const listStyle = useMemo(() => [style, fill && styles.container], [fill, style])

  if (sections != undefined) {
    list = (
      <SectionList
        ref={sectionListRef as any}
        windowSize={100}
        maxToRenderPerBatch={100}
        stickySectionHeadersEnabled={stickySectionHeadersEnabled}
        style={listStyle}
        keyExtractor={idExtractor}
        sections={sections}
        renderItem={renderItem}
        refreshing={isRefreshing}
        horizontal={horizontal}
        inverted={inverted}
        onRefresh={onRefresh}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmptyComponent}
        renderSectionFooter={renderSectionFooter}
        ItemSeparatorComponent={renderItemSeparator}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={onFetchNext}
        scrollEnabled={!disabled}
        keyboardShouldPersistTaps='always'
        keyboardDismissMode='on-drag'
        contentContainerStyle={contentContainerStyle}
        showsHorizontalScrollIndicator={showScrollIndicator}
        showsVerticalScrollIndicator={showScrollIndicator}
        onScroll={onScroll}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
        scrollIndicatorInsets={scrollIndicatorInsets}
      />
    )
  } else {
    list = (
      <FlatList
        ref={listRef as Ref<FlatList<S>>}
        style={listStyle}
        keyExtractor={idExtractor}
        data={visibleItems}
        renderItem={renderItem}
        refreshing={isRefreshing}
        horizontal={horizontal}
        inverted={inverted}
        onRefresh={onRefresh}
        onEndReached={onFetchNext}
        contentContainerStyle={contentContainerStyle}
        ItemSeparatorComponent={renderItemSeparator}
        keyboardShouldPersistTaps='always'
        keyboardDismissMode='on-drag'
        numColumns={numColumns}
        scrollEnabled={!disabled}
        columnWrapperStyle={numColumns && numColumns > 1 ? columnWrapperStyle : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={renderEmptyComponent}
        showsHorizontalScrollIndicator={showScrollIndicator}
        showsVerticalScrollIndicator={showScrollIndicator}
        onScroll={onScroll}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
        scrollIndicatorInsets={scrollIndicatorInsets}
        maintainVisibleContentPosition={
          maintainVisibleContent ? maintainVisibleContentPosition : undefined
        }
      />
    )
  }

  return <View style={fill && styles.container}>{list}</View>
}

export const List = React.forwardRef(ListComponent) as <S>(
  props: ListProps<S> & { ref?: Ref<FlatList<S>> | Ref<SectionList<S>> },
) => ReturnType<typeof ListComponent>
