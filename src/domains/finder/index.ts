/**
 * @file 文件管理器
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};
enum FinderLayouts {
  /** 图标 */
  Icons,
  /** 列表 */
  List,
  /** 多列 */
  Columns,
  /** 画廊 */
  Gallery,
}
class FinderCore extends BaseDomain<TheTypesOfEvents> {
  layout: FinderLayouts = FinderLayouts.Columns;
}
