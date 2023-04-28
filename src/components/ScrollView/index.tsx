/**
 * @file 加载更多容器
 */
// import { useEffect, useRef } from "react";
// import cx from "classnames";
import debounce from "lodash/fp/debounce";
import { Response } from "@list-helper/core/typing";
import { children, onMount } from "solid-js";

// interface IProps extends Omit<Response<unknown>, "page" | "pageSize"> {
//   className?: string;
//   children?: React.ReactNode;
//   onLoadMore?: () => void;
// }
const ScrollView = (props) => {
  const {
    className,
    dataSource,
    noMore = false,
    loading,
    error,
    // children,
    onLoadMore,
  } = props;
  // const onLoadMoreRef = useRef(onLoadMore);
  // useEffect(() => {
  //   onLoadMoreRef.current = onLoadMore;
  // }, [onLoadMore]);

  onMount(() => {
    const handler = debounce(400, async () => {
      if (
        document.documentElement.scrollTop +
          document.documentElement.clientHeight +
          600 >=
        document.body.clientHeight
      ) {
        if (onLoadMore) {
          onLoadMore();
        }
      }
    });

    document.addEventListener("scroll", handler);
    return () => {
      document.removeEventListener("scroll", handler);
    };
  });

  const c = children(() => props.children);

  return (
    <div class={className}>
      {c()}
      <div class="overflow-hidden">
        {(() => {
          if (error) {
            return (
              <div class="my-6 text-gray-300 text-center">{error.message}</div>
            );
          }
          if (dataSource && dataSource.length === 0 && noMore && !loading) {
            return <div class="my-6 text-gray-300 text-center">结果为空</div>;
          }
          if (loading) {
            return <div class="my-6 text-gray-300 text-center">加载中...</div>;
          }
          return <div class="my-6 text-gray-300 text-center">没有更多了~</div>;
        })()}
      </div>
    </div>
  );
};

export default ScrollView;
